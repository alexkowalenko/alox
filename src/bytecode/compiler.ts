//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { AstVisitor, LoxAssign, LoxBinary, LoxBlock, LoxBool, LoxBreak, LoxCall, LoxClassDef, LoxExpr, LoxFor, LoxFunDef, LoxGet, LoxGroup, LoxIdentifier, LoxIf, LoxLiteral, LoxNil, LoxNumber, LoxPrint, LoxProgram, LoxReturn, LoxSet, LoxString, LoxSuper, LoxThis, LoxUnary, LoxVar, LoxWhile } from "../ast";
import { LoxValue, Evaluator } from "../runtime";
import { SymbolTable } from "../symboltable";
import { Options } from "../interpreter";
import { Opcode, VM } from "./vm";
import { TokenType, Location } from "../token";
import { RuntimeError } from "../error";
import { CompiledFunction, FunctionType } from "./bytecode_runtime";

export class Compiler implements AstVisitor<void>, Evaluator {

    constructor(
        public symboltable: SymbolTable<LoxValue>, // only has native functions from stdlib.
        private readonly options: Options) { }
    private current_function!: CompiledFunction;

    init() {
        let fn = new LoxFunDef(new Location(), new LoxIdentifier(new Location(), "_main"));
        this.current_function = new CompiledFunction(fn, FunctionType.FUNCTION);
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
    }

    private function(f: LoxFunDef, type: FunctionType) {
        let funct = new CompiledFunction(f, type, this.current());
        let prev = this.current_function
        this.current_function = funct;

        this.declare_var(f.name!, -1);
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
        let new_funct_env = this.current_function;
        this.current_function = prev;

        if (this.options.debug) {
            funct.bytecodes.disassemble(f.name?.id ?? "λ")
        }

        this.emit_constant(Opcode.CLOSURE, funct);
        //console.log(`upvalues ${new_funct_env.upvalues.length}`)
        new_funct_env.upvalues.forEach(up => {
            this.emit_byte(up.is_local ? 1 : 0)
            this.emit_byte(up.index)
        })
    }

    visitFun(f: LoxFunDef): void {
        this.function(f, FunctionType.FUNCTION);
        this.define_var(f.name);
    }

    visitClass(c: LoxClassDef): void {
        this.emit_constant(Opcode.CLASS, c.name.id);
        c.methods.forEach(method => {
            let type = method.name.id === "init" ? FunctionType.INITIALISER : FunctionType.METHOD
            this.function(method, type);
            this.emit_constant(Opcode.METHOD, method.name.id)
        })
        this.define_var(c.name);
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
        if (this.current().type === FunctionType.INITIALISER) {
            this.emit_instruction_word(Opcode.GET_LOCAL, 0);
        } else if (e.expr) {
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
            if (this.current().type == FunctionType.INITIALISER) {
                this.emit_instruction_word(Opcode.GET_LOCAL, 0);
            }
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
        e.expr.accept(this);
        this.emit_constant(Opcode.GET_PROPERTY, e.ident.id);
    }

    visitSet(e: LoxSet): void {
        e.value.accept(this);
        e.expr.accept(this);
        this.emit_constant(Opcode.SET_PROPERTY, e.ident.id);
    }

    visitAssign(e: LoxAssign): void {
        e.right.accept(this);

        if (e.left instanceof LoxIdentifier) {
            this.named_var(e.left as LoxIdentifier, true);
            return
        }
        throw new RuntimeError(`can't assign to ${e.left.toString()}`, e.left.location)
    }

    visitLiteral(expr: LoxLiteral): void {
        expr.accept(this);
    }

    visitThis(e: LoxThis): void {
        this.visitIdentifier(new LoxIdentifier(e.location, "this"));
    }

    visitSuper(e: LoxSuper): void {
        throw new Error("Method not implemented.");
    }

    visitIdentifier(e: LoxIdentifier): void {
        if (this.options.var) {
            console.log(`var: find ${e.id} depth ${this.current().scope_depth} of ${this.current().fn.name}`)
        }
        this.named_var(e);
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
        if (this.options.var) {
            console.log(`begin scope ${this.current().scope_depth} of ${this.current().fn.name}`)
        }
    }

    end_scope() {
        //console.log(`end_scope: locals count: ${this.locals.length}`)
        this.current().scope_depth--;
        if (this.options.var) {
            console.log(`end scope ${this.current().scope_depth} of ${this.current().fn.name}`)
        }

        // pop local from the stack
        this.current().locals.forEach((local) => {
            if (local.depth > this.current().scope_depth && local.pop) {
                //console.log(`remove local ${local.name.id} depth ${local.depth}`)
                this.emit_instruction(Opcode.POP_LOCAL)
            }
        })
        // remove locals from the list
        this.current().remove_locals();
        //console.log(`end_scope: locals count: ${this.locals.length}`)
    }

    /**
     * Adds v to local variable list and instructs to create it.
     * @param v 
     * @returns 
     */
    define_var(v: LoxIdentifier) {
        if (this.options.var) {
            console.log(`var: define ${v.id} depth ${this.current().scope_depth} of ${this.current().fn.name}`)
        }
        if (this.current().scope_depth === 0) {
            if (this.options.var) {
                console.log(`var: define ${v.id} global}`)
            }
            this.emit_constant(Opcode.DEF_GLOBAL, v.id)
            return;
        }
        this.current().add_local(v, this.current().scope_depth, true)
        this.emit_instruction(Opcode.DEF_LOCAL)
        if (this.options.var) {
            console.log(`var: define ${v.id} local`)
        }
    }

    /**
     * Adds v to local variable list only
     * @param v 
     * @returns 
     */
    declare_var(v: LoxIdentifier, adjust = 0) {
        if (this.options.var) {
            console.log(`var: declare ${v.id} depth ${this.current().scope_depth} of ${this.current().fn.name}`)
        }
        if (this.current().scope_depth === 0) {
            return;
        }
        this.current().add_local(v, this.current().scope_depth + adjust, false)
    }

    named_var(v: LoxIdentifier, can_assign = false) {
        let index = this.current().find_var(v);
        if (index >= 0) {
            if (can_assign) {
                this.emit_instruction_word(Opcode.SET_LOCAL, index)
            } else {
                this.emit_instruction_word(Opcode.GET_LOCAL, index)
            }
            return;
        } else if ((index = this.current().resolveUpvalue(v)) !== -1) {
            if (can_assign) {
                this.emit_instruction_word(Opcode.SET_UPVALUE, index)
            } else {
                this.emit_instruction_word(Opcode.GET_UPVALUE, index)
            }
            return;
        } else {
            if (can_assign) {
                this.emit_constant(Opcode.SET_GLOBAL, v.id)
            } else {
                this.emit_constant(Opcode.GET_GLOBAL, v.id)
            }
        }
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

    dump_upvalues() {
        let buf = "upvalues: ";
        this.current().locals.forEach(x => {
            buf += x.toString() + " "
        })
    }
}