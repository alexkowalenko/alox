//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { AstVisitor, LoxAssign, LoxBinary, LoxBlock, LoxBool, LoxBreak, LoxCall, LoxClassDef, LoxExpr, LoxFor, LoxFunDef, LoxGet, LoxGroup, LoxIdentifier, LoxIf, LoxLiteral, LoxNil, LoxNumber, LoxPrint, LoxProgram, LoxReturn, LoxSet, LoxString, LoxSuper, LoxThis, LoxUnary, LoxVar, LoxWhile } from "./ast";
import { Evaluator } from "./evaluator";
import { LoxValue } from "./runtime";
import { SymbolTable } from "./symboltable";
import { Options } from "./interpreter";
import { Chunk } from "./chunk";
import { Opcode, VM } from "./vm";
import { TokenType, Location } from "./token";
import { RuntimeError } from "./error";


class Local {
    constructor(public name: LoxIdentifier, public depth: number) { }
}

export class Compiler implements AstVisitor<void>, Evaluator {

    constructor(public symboltable: SymbolTable<LoxValue>, private readonly options: Options) {
        this.bytecodes = new Chunk();
    }
    private bytecodes: Chunk;
    private scope_depth = 0;
    private locals = new Array<Local>;

    private init() {
        this.bytecodes = new Chunk();
    }

    eval(expr: LoxExpr): LoxValue {
        this.init();
        expr.accept(this);
        this.emit_instruction(Opcode.RETURN);

        if (this.options.debug) {
            this.bytecodes.disassemble("program:")
        }

        let vm = new VM(this.bytecodes, this.symboltable, this.options);
        vm.debug = this.options.trace;
        let val = vm.interpret();
        if (this.options.debug) {
            vm.dump_symboltable();
        }
        return val!;
    }

    visitProgram(prog: LoxProgram): void {
        //console.log("program")
        prog.statements.forEach((stat, i) => {
            if (this.options.debug) {
                this.emit_location(stat.location);
            }
            stat.accept(this)
            if (i < prog.statements.length - 2) {
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
        if (this.scope_depth > 0) {
            return;
        }
        this.emit_constant(Opcode.DEF_GLOBAL, v.ident.id)
    }

    visitFun(f: LoxFunDef): void {
        throw new Error("Method not implemented.");
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
        throw new Error("Method not implemented.");
    }

    visitFor(expr: LoxFor): void {
        throw new Error("Method not implemented.");
    }

    visitBreak(expr: LoxBreak): void {
        throw new Error("Method not implemented.");
    }

    visitReturn(e: LoxReturn): void {
        throw new Error("Method not implemented.");
    }

    visitPrint(p: LoxPrint): void {
        p.expr.accept(this);
        this.emit_instruction(Opcode.PRINT);
    }

    visitBlock(block: LoxBlock): void {
        this.begin_scope();
        block.statements.forEach((stat, i) => {
            if (this.options.debug) {
                this.emit_location(stat.location);
            }
            stat.accept(this)
            if (i < block.statements.length - 1) {
                // get rid value, except last
                this.emit_instruction(Opcode.POP)
            }
        })
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
        let op = e.operator == TokenType.AND ? Opcode.JMP_IF_FALSE : Opcode.JMP_IF_TRUE;
        e.left.accept(this);
        let jump = this.emit_jump(op)
        this.emit_instruction(Opcode.POP)
        e.right.accept(this);
        this.patch_jump(jump);
    }

    visitBinary(e: LoxBinary): void {
        if (e.operator == TokenType.AND || e.operator == TokenType.OR) {
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
        throw new Error("Method not implemented.");
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
        if (this.scope_depth > 0) {
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
        this.scope_depth++;
    }

    end_scope() {
        //console.log(`end_scope: locals count: ${this.locals.length}`)
        this.scope_depth--;

        // pop local from the stack
        this.locals.forEach((local) => {
            if (local.depth > this.scope_depth) {
                //console.log(`remove local ${local.name.id} depth ${local.depth}`)
                this.emit_instruction(Opcode.POP_LOCAL)
            }
        })
        // remove locals from the list
        this.locals = this.locals.filter((local) => {
            return local.depth <= this.scope_depth
        })
        //console.log(`end_scope: locals count: ${this.locals.length}`)
    }

    define_var(v: LoxIdentifier) {
        if (this.scope_depth == 0) {
            return;
        }
        // console.log(`define_var ${v.id} depth ${this.scope_depth}`)
        this.locals.push(new Local(v, this.scope_depth))
        this.emit_instruction_word(Opcode.DEF_LOCAL, this.locals.length - 1)
    }

    find_var(v: LoxIdentifier): number {
        let index = this.locals.reverse().findIndex((local) => {
            return local.name.id === v.id
        })
        //console.log(`find var: ${e.id} - index: ${index}`)
        if (index >= 0) {
            return this.locals.length - index - 1;
        } else {
            return -1;
        }
    }

    emit_instruction(instr: Opcode) {
        this.bytecodes.write_byte(instr);
    }

    emit_instruction_word(instr: Opcode, val: number) {
        this.bytecodes.write_byte(instr);
        this.bytecodes.write_word(val);
    }

    add_constant(val: LoxValue) {
        let c = this.bytecodes.add_constant(val);
        this.emit_instruction(Opcode.CONSTANT);
        this.bytecodes.write_word(c);
    }

    emit_constant(instr: Opcode, val: LoxValue) {
        let c = this.bytecodes.add_constant(val);
        this.emit_instruction(instr);
        this.bytecodes.write_word(c);
    }

    emit_location(location: Location) {
        this.emit_instruction(Opcode.LINE);
        this.bytecodes.write_word(location.line)
    }

    emit_jump(instr: Opcode): number {
        this.emit_instruction(instr);
        this.bytecodes.write_word(0);
        //console.log(`jump loc: ${this.bytecodes.end - 2}`)
        return this.bytecodes.end - 2;
    }

    patch_jump(offset: number) {
        let jump = this.bytecodes.end - offset - 2;
        //console.log(`jump patch: ${jump}`)
        this.bytecodes.write_loc_word(offset, jump);
    }


}