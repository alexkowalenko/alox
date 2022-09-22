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


export class Compiler implements AstVisitor<LoxValue>, Evaluator {

    constructor(public symboltable: SymbolTable<LoxValue>, private readonly options: Options) { }

    eval(expr: LoxExpr): LoxValue {
        return expr.accept(this);
    }

    visitProgram(prog: LoxProgram): LoxValue {
        let val = null
        for (const stat of prog.statements) {
            val = stat.accept(this)
        }
        return val
    }

    visitVar(expr: LoxVar): LoxValue {
        throw new Error("Method not implemented.");
    }

    visitFun(f: LoxFunDef): LoxValue {
        throw new Error("Method not implemented.");
    }

    visitClass(c: LoxClassDef): LoxValue {
        throw new Error("Method not implemented.");
    }

    visitIf(expr: LoxIf): LoxValue {
        throw new Error("Method not implemented.");
    }

    visitWhile(expr: LoxWhile): LoxValue {
        throw new Error("Method not implemented.");
    }

    visitFor(expr: LoxFor): LoxValue {
        throw new Error("Method not implemented.");
    }

    visitBreak(expr: LoxBreak): LoxValue {
        throw new Error("Method not implemented.");
    }

    visitReturn(e: LoxReturn): LoxValue {
        throw new Error("Method not implemented.");
    }

    visitPrint(expr: LoxPrint): LoxValue {
        throw new Error("Method not implemented.");
    }

    visitBlock(expr: LoxBlock): LoxValue {
        throw new Error("Method not implemented.");
    }

    visitExpr(expr: LoxExpr): LoxValue {
        return expr.accept(this);
    }

    visitUnary(e: LoxUnary): LoxValue {
        throw new Error("Method not implemented.");
    }

    visitBinary(e: LoxBinary): LoxValue {
        throw new Error("Method not implemented.");
    }

    visitGroup(e: LoxGroup): LoxValue {
        throw new Error("Method not implemented.");
    }

    visitCall(e: LoxCall): LoxValue {
        throw new Error("Method not implemented.");
    }

    visitGet(e: LoxGet): LoxValue {
        throw new Error("Method not implemented.");
    }

    visitSet(e: LoxSet): LoxValue {
        throw new Error("Method not implemented.");
    }

    visitAssign(e: LoxAssign): LoxValue {
        throw new Error("Method not implemented.");
    }

    visitLiteral(expr: LoxLiteral): LoxValue {
        return expr.accept(this);
    }

    visitThis(e: LoxThis): LoxValue {
        throw new Error("Method not implemented.");
    }

    visitSuper(e: LoxSuper): LoxValue {
        throw new Error("Method not implemented.");
    }

    visitIdentifier(e: LoxIdentifier): LoxValue {
        throw new Error("Method not implemented.");
    }

    visitNumber(expr: LoxNumber): LoxValue {
        throw new Error("Method not implemented.");
    }

    visitString(expr: LoxString): LoxValue {
        throw new Error("Method not implemented.");
    }

    visitBool(expr: LoxBool): LoxValue {
        throw new Error("Method not implemented.");
    }

    visitNil(expr: LoxNil): LoxValue {
        throw new Error("Method not implemented.");
    }

    resolve(expr: LoxExpr, depth: number): void {
        throw new Error("Method not implemented.");
    }
}