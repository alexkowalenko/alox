//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { AstVisitor, LoxBool, LoxExpr, LoxGroup, LoxLiteral, LoxNil, LoxNumber, LoxUnary } from "./ast";

import { Writable } from 'stream'

export class Printer extends AstVisitor<string> {

    constructor() { super() }

    public print(expr: LoxExpr): string {
        return expr.accept(this)
    }

    visitUnary(e: LoxUnary): string {
        return e.toString()
    }

    visitGroup(e: LoxGroup): string {
        return e.toString()
    }

    visitNumber(expr: LoxNumber): string {
        return "" + expr.value
    }

    visitBool(expr: LoxBool): string {
        return expr.toString()
    }

    visitNil(expr: LoxNil): string {
        return expr.toString()
    }
}