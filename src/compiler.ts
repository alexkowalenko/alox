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
import { TokenType } from "./token";


export class Compiler implements AstVisitor<void>, Evaluator {

    constructor(public symboltable: SymbolTable<LoxValue>, private readonly options: Options) {
        this.bytecodes = new Chunk();
    }
    private bytecodes: Chunk;

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

        let vm = new VM(this.bytecodes);
        vm.debug = false;
        let val = vm.interpret();
        return val!;
    }

    visitProgram(prog: LoxProgram): void {
        for (const stat of prog.statements) {
            stat.accept(this)
        }
    }

    visitVar(expr: LoxVar): void {
        throw new Error("Method not implemented.");
    }

    visitFun(f: LoxFunDef): void {
        throw new Error("Method not implemented.");
    }

    visitClass(c: LoxClassDef): void {
        throw new Error("Method not implemented.");
    }

    visitIf(expr: LoxIf): void {
        throw new Error("Method not implemented.");
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

    visitPrint(expr: LoxPrint): void {
        throw new Error("Method not implemented.");
    }

    visitBlock(expr: LoxBlock): void {
        throw new Error("Method not implemented.");
    }

    visitExpr(expr: LoxExpr): void {
        expr.accept(this);
    }

    visitUnary(e: LoxUnary): void {
        e.expr.accept(this);
        if (e.prefix == TokenType.MINUS) {
            this.emit_instruction(Opcode.NEGATE)
            return;
        }
        throw new Error("Method not implemented.");
    }

    visitBinary(e: LoxBinary): void {
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
        throw new Error("Method not implemented.");
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
        throw new Error("Method not implemented.");
    }

    visitNumber(expr: LoxNumber): void {
        this.add_constant(expr.value);
    }

    visitString(expr: LoxString): void {
        this.add_constant(expr.value);
    }

    visitBool(expr: LoxBool): void {
        this.add_constant(expr.value);
    }

    visitNil(expr: LoxNil): void {
        this.add_constant(null);
    }

    resolve(expr: LoxExpr, depth: number): void {
        throw new Error("Method not implemented.");
    }

    emit_instruction(instr: Opcode) {
        this.bytecodes.write_byte(instr);
    }

    add_constant(val: LoxValue) {
        let c = this.bytecodes.add_constant(val);
        this.emit_instruction(Opcode.CONSTANT);
        this.bytecodes.write_word(c);
    }
}