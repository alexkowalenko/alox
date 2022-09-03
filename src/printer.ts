//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { AstVisitor, LoxBool, LoxExpr, LoxGroup, LoxLiteral, LoxNil, LoxNumber } from "./ast";

import { Writable } from 'stream'

export class Printer extends AstVisitor<string> {

    constructor() { super() }

    public print(expr: LoxExpr): string {
        return expr.accept(this)
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