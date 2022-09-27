//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { AstVisitor, LoxAssign, LoxBinary, LoxBlock, LoxBool, LoxBreak, LoxCall, LoxClassDef, LoxExpr, LoxFor, LoxFunDef, LoxGet, LoxGroup, LoxIdentifier, LoxIf, LoxLiteral, LoxNil, LoxNumber, LoxPrint, LoxProgram, LoxReturn, LoxSet, LoxString, LoxSuper, LoxThis, LoxUnary, LoxVar, LoxWhile } from "../ast";
import { LoxValue, LoxFunction, Evaluator, LoxClosure } from "../runtime";
import { SymbolTable } from "../symboltable";
import { Options } from "../interpreter";
import { Chunk } from "./chunk";
import { Opcode, VM } from "./vm";
import { TokenType, Location } from "../token";
import { RuntimeError } from "../error";


class Local {
    constructor(public name: LoxIdentifier, public depth: number, public pop = true) { }
}

export class CompiledFunction extends LoxFunction {

    constructor(public fn: LoxFunDef) {
        super(fn, new SymbolTable, false)
        this.bytecodes = new Chunk;
    }

    bytecodes: Chunk;
    scope_depth = 0;
    locals = new Array<Local>;

    last_continue: number | undefined = undefined;
    last_break: number | undefined = undefined;
}

export class Compiler implements AstVisitor<void>, Evaluator {

    constructor(public symboltable: SymbolTable<LoxValue>,
        private readonly options: Options) {
    }
    private current_function!: CompiledFunction;

    init() {
        let fn = new LoxFunDef(new Location(), new LoxIdentifier(new Location(), "_main"));
        this.current_function = new CompiledFunction(fn);
    }

    current() {
        return this.current_function;
    }

    eval(expr: LoxExpr): LoxValue {
        this.init();
        expr.accept(this);
        this.emit_instruction(Opcode.RETURN);

        if (this.options.debug) {
            this.current().bytecodes.disassemble(this.current().fn.name!.id);
        }

        let vm = new VM(this.current().bytecodes, this.symboltable, this.options);
        vm.debug = this.options.trace;
        let val = vm.interpret();
        if (this.options.debug) {
            // check stack hygiene 
            if (vm.stack_length() > 0) {
                console.error("** Stack hygiene")
            }
            vm.dump_stack();
            vm.dump_symboltable();
        }
        return val!;
    }

    visitProgram(prog: LoxProgram): void {
        //console.log("program")
        prog.statements.forEach((stat, i) => {
            this.emit_location(stat.location);
            stat.accept(this)
            if (i < prog.statements.length - 1) {
                // get rid value, except last
                this.emit_instruction(Opcode.POP)
            }
        })
    }

    visitVar(v: LoxVar): void {
        //console.log("var")
        if (v.expr) {
            v.expr.accept(this);
        } else {
            this.emit_instruction(Opcode.NIL)
        }
        this.define_var(v.ident);
        if (this.current().scope_depth > 0) {
            return;
        }
        this.emit_constant(Opcode.DEF_GLOBAL, v.ident.id)
    }

    visitFun(f: LoxFunDef): void {
        let funct = new CompiledFunction(f);
        let prev = this.current_function
        this.current_function = funct;

        this.declare_var(f.name!);
        this.begin_scope();
        f.args.forEach(a => {
            this.declare_var(a);
        })
        if (f.body) {
            f.body.accept(this);
            if (f.body.statements.length === 0) {
                this.emit_instruction(Opcode.RETURN)
            }
        }

        this.end_scope();

        this.current_function = prev;

        if (this.options.debug) {
            funct.bytecodes.disassemble(f.name?.id ?? "λ")
        }

        let cl = new LoxClosure(funct);
        this.symboltable.set(f.name?.id!, cl);
        this.add_constant(cl as unknown as LoxFunction);
    }

    visitClass(c: LoxClassDef): void {
        throw new Error("Method not implemented.");
    }

    visitIf(expr: LoxIf): void {
        expr.expr.accept(this);
        let then_jump = this.emit_jump(Opcode.JMP_IF_FALSE);
        this.emit_instruction(Opcode.POP)

        expr.then.accept(this);
        if (expr.else) {
            let else_jump = this.emit_jump(Opcode.JUMP);
            this.patch_jump(then_jump);
            this.emit_instruction(Opcode.POP)
            expr.else.accept(this);
            this.patch_jump(else_jump);
            return;
        }
        this.patch_jump(then_jump);
    }

    visitWhile(expr: LoxWhile): void {
        let start = this.current().bytecodes.end;
        this.current().last_continue = this.current().bytecodes.end;

        expr.expr.accept(this);
        let exit = this.emit_jump(Opcode.JMP_IF_FALSE)
        this.emit_instruction(Opcode.POP)

        expr.stats.accept(this);
        this.emit_instruction(Opcode.POP)
        this.emit_jump_back(Opcode.JUMP, start)
        this.patch_jump(exit)


        if (this.current().last_break) {
            this.patch_jump(this.current().last_break!)
            this.current().last_break = undefined;
        }
    }

    visitFor(expr: LoxFor): void {
        this.begin_scope();
        let exit = 0;

        // initialise
        if (expr.init) {
            expr.init.accept(this);
            this.emit_instruction(Opcode.POP)
        }

        // condition
        let start = this.current().bytecodes.end;

        this.current().last_continue = this.current().bytecodes.end;
        if (expr.cond) {
            expr.cond.accept(this);
            exit = this.emit_jump(Opcode.JMP_IF_FALSE)
            this.emit_instruction(Opcode.POP)
        }

        // statements
        expr.stat?.accept(this);
        this.emit_instruction(Opcode.POP)

        // do iterator

        if (expr.iter) {
            expr.iter.accept(this);
            this.emit_instruction(Opcode.POP)
        }

        // jump back

        this.emit_jump_back(Opcode.JUMP, start)
        if (expr.cond) {
            this.patch_jump(exit);
            this.emit_instruction(Opcode.POP)
        }
        if (this.current().last_break) {
            this.patch_jump(this.current().last_break!)
            this.current().last_break = undefined;
        }
        this.end_scope();
    }

    visitBreak(expr: LoxBreak): void {
        if (expr.what === TokenType.CONTINUE) {
            if (this.current().last_continue) {
                this.emit_jump_back(Opcode.JUMP, this.current().last_continue!)
                this.current().last_continue = undefined;
            }
        }
        this.current().last_break = this.emit_jump(Opcode.JUMP);
    }

    visitReturn(e: LoxReturn): void {
        if (e.expr) {
            e.expr.accept(this);
        } else {
            this.emit_instruction(Opcode.NIL);
        }
        this.emit_instruction(Opcode.RETURN);
    }

    visitPrint(p: LoxPrint): void {
        p.expr.accept(this);
        this.emit_instruction(Opcode.PRINT);
    }

    visitBlock(block: LoxBlock): void {
        this.begin_scope();
        if (block.statements.length > 0) {
            block.statements.forEach((stat, i) => {
                this.emit_location(stat.location);
                stat.accept(this)
                if (i != block.statements.length - 1) {
                    this.emit_instruction(Opcode.POP)
                }
            })
        } else {
            this.emit_instruction(Opcode.NIL)
        }
        this.end_scope();
    }

    visitExpr(expr: LoxExpr): void {
        // console.log("expr")
        expr.accept(this);
    }

    visitUnary(e: LoxUnary): void {
        e.expr.accept(this);
        switch (e.prefix) {
            case TokenType.MINUS:
                this.emit_instruction(Opcode.NEGATE)
                return;
            case TokenType.BANG:
                this.emit_instruction(Opcode.NOT)
                return;
        }
        throw new Error("Method not implemented.");
    }

    logical(e: LoxBinary) {
        let op = e.operator === TokenType.AND ? Opcode.JMP_IF_FALSE : Opcode.JMP_IF_TRUE;
        e.left.accept(this);
        let jump = this.emit_jump(op)
        this.emit_instruction(Opcode.POP)
        e.right.accept(this);
        this.patch_jump(jump);
    }

    visitBinary(e: LoxBinary): void {
        if (e.operator === TokenType.AND || e.operator === TokenType.OR) {
            this.logical(e);
            return;
        }
        e.right.accept(this);
        e.left.accept(this);
        switch (e.operator) {
            case TokenType.PLUS:
                this.emit_instruction(Opcode.ADD);
                return
            case TokenType.MINUS:
                this.emit_instruction(Opcode.SUBTRACT)
                return
            case TokenType.ASTÉRIX:
                this.emit_instruction(Opcode.MULTIPLY)
                return
            case TokenType.SLASH:
                this.emit_instruction(Opcode.DIVIDE)
                return
            case TokenType.EQUAL_EQUAL:
                this.emit_instruction(Opcode.EQUAL)
                return
            case TokenType.BANG_EQUAL:
                this.emit_instruction(Opcode.EQUAL)
                this.emit_instruction(Opcode.NOT)
                return
            case TokenType.LESS:
                this.emit_instruction(Opcode.LESS)
                return
            case TokenType.LESS_EQUAL:
                this.emit_instruction(Opcode.GREATER)
                this.emit_instruction(Opcode.NOT)
                return
            case TokenType.GREATER:
                this.emit_instruction(Opcode.GREATER)
                return
            case TokenType.GREATER_EQUAL:
                this.emit_instruction(Opcode.LESS)
                this.emit_instruction(Opcode.NOT)
                return
        }
        throw new Error("Method not implemented.");
    }

    visitGroup(e: LoxGroup): void {
        e.expr.accept(this);
    }

    visitCall(e: LoxCall): void {
        e.expr.accept(this);
        e.arguments.forEach(arg => {
            arg.accept(this);
        })
        this.emit_instruction_byte(Opcode.CALL, e.arguments.length);
    }

    visitGet(e: LoxGet): void {
        throw new Error("Method not implemented.");
    }

    visitSet(e: LoxSet): void {
        throw new Error("Method not implemented.");
    }

    visitAssign(e: LoxAssign): void {
        // console.log("assign")
        e.right.accept(this);

        if (e.left instanceof LoxIdentifier) {
            let id = e.left as LoxIdentifier;
            let index = this.find_var(id);
            if (index >= 0) {
                this.emit_instruction_word(Opcode.SET_LOCAL, index)
                return;
            }
            this.emit_constant(Opcode.SET_GLOBAL, (e.left as LoxIdentifier).id)
            return
        }
        throw new RuntimeError(`can't assign to ${e.left.toString()}`, e.left.location)
    }

    visitLiteral(expr: LoxLiteral): void {
        expr.accept(this);
    }

    visitThis(e: LoxThis): void {
        throw new Error("Method not implemented.");
    }

    visitSuper(e: LoxSuper): void {
        throw new Error("Method not implemented.");
    }

    visitIdentifier(e: LoxIdentifier): void {
        // console.log(`find var: ${e.id}`)
        if (this.current().scope_depth > 0) {
            let index = this.find_var(e);
            if (index >= 0) {
                this.emit_instruction_word(Opcode.GET_LOCAL, index)
                return;
            }
        }
        this.emit_constant(Opcode.GET_GLOBAL, e.id)
    }

    visitNumber(expr: LoxNumber): void {
        this.add_constant(expr.value);
    }

    visitString(expr: LoxString): void {
        this.add_constant(expr.value);
    }

    visitBool(expr: LoxBool): void {
        expr.value ? this.emit_instruction(Opcode.TRUE) : this.emit_instruction(Opcode.FALSE)
    }

    visitNil(expr: LoxNil): void {
        this.emit_instruction(Opcode.NIL);
    }

    resolve(expr: LoxExpr, depth: number): void {
        // closure?
    }

    begin_scope() {
        this.current().scope_depth++;
    }

    end_scope() {
        //console.log(`end_scope: locals count: ${this.locals.length}`)
        this.current().scope_depth--;

        // pop local from the stack
        this.current().locals.forEach((local) => {
            if (local.depth > this.current().scope_depth && local.pop) {
                //console.log(`remove local ${local.name.id} depth ${local.depth}`)
                this.emit_instruction(Opcode.POP_LOCAL)
            }
        })
        // remove locals from the list
        this.current().locals = this.current().locals.filter((local) => {
            return local.depth <= this.current().scope_depth
        })
        //console.log(`end_scope: locals count: ${this.locals.length}`)
    }

    define_var(v: LoxIdentifier) {
        if (this.current().scope_depth === 0) {
            return;
        }
        // console.log(`define_var ${v.id} depth ${this.scope_depth}`)
        this.current().locals.push(new Local(v, this.current().scope_depth))
        this.emit_instruction(Opcode.DEF_LOCAL)
    }

    declare_var(v: LoxIdentifier) {
        if (this.current().scope_depth === 0) {
            return;
        }
        // console.log(`define_var ${v.id} depth ${this.scope_depth}`)
        this.current().locals.push(new Local(v, this.current().scope_depth, false))
    }

    find_var(v: LoxIdentifier): number {
        // search the list backwards and return its index.
        let index = -1;
        for (let i = this.current().locals.length - 1; i >= 0; i--) {
            if (this.current().locals[i].name.id === v.id) {
                index = i;
                break;
            }
        }
        return index;
    }

    emit_instruction(instr: Opcode) {
        this.current().bytecodes.write_byte(instr);
    }

    emit_byte(val: number) {
        this.current().bytecodes.write_byte(val)
    }

    emit_instruction_word(instr: Opcode, val: number) {
        this.current().bytecodes.write_byte(instr);
        this.current().bytecodes.write_word(val);
    }

    emit_instruction_byte(instr: Opcode, val: number) {
        this.current().bytecodes.write_byte(instr);
        this.current().bytecodes.write_byte(val);
    }

    add_constant(val: LoxValue) {
        let c = this.current().bytecodes.add_constant(val);
        this.emit_instruction(Opcode.CONSTANT);
        this.current().bytecodes.write_word(c);
    }

    emit_constant(instr: Opcode, val: LoxValue) {
        let c = this.current().bytecodes.add_constant(val);
        this.emit_instruction(instr);
        this.current().bytecodes.write_word(c);
    }

    emit_location(location: Location) {
        this.emit_instruction(Opcode.LINE);
        this.current().bytecodes.write_word(location.line)
    }

    emit_jump(instr: Opcode, where = 0): number {
        this.emit_instruction(instr);
        this.current().bytecodes.write_word(where);
        //console.log(`jump loc: ${this.bytecodes.end - 2}`)
        return this.current().bytecodes.end - 2;
    }

    emit_jump_back(intr: Opcode, where: number) {
        this.emit_jump(intr, where - this.current().bytecodes.end - 3)
    }

    patch_jump(offset: number) {
        let jump = this.current().bytecodes.end - offset - 2;
        //console.log(`jump patch: ${jump}`)
        this.current().bytecodes.write_loc_word(offset, jump);
    }


}