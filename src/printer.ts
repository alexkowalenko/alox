//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { AstVisitor, LoxBinary, LoxBool, LoxExpr, LoxGroup, LoxLiteral, LoxNil, LoxNumber, LoxString, LoxUnary } from "./ast";

import { Writable } from 'stream'

export class Printer extends AstVisitor<string> {

    constructor() { super() }

    public print(expr: LoxExpr): string {
        return expr.accept(this)
    }

    visitUnary(e: LoxUnary): string {
        return e.toString()
    }

    visitBinary(e: LoxBinary): string {
        return e.toString();
    }

    visitGroup(e: LoxGroup): string {
        return e.toString()
    }

    visitNumber(expr: LoxNumber): string {
        return "" + expr.value
    }

    visitString(expr: LoxString): string {
        return '"' + expr.value + '"'
    }

    visitBool(expr: LoxBool): string {
        return expr.toString()
    }

    visitNil(expr: LoxNil): string {
        return expr.toString()
    }
}