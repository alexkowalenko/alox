//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { AstVisitor, LoxExpr, LoxNumber, LoxBool, LoxNil, LoxUnary, LoxBinary } from "./ast";
import { RuntimeError } from "./error";
import { Location, TokenType } from "./token";

export type LoxValue = number | string | boolean | null

export class Evaluator extends AstVisitor<LoxValue> {
    constructor() {
        super()
    }

    eval(expr: LoxExpr): LoxValue {
        return expr.accept(this)
    }

    private check_number(v: LoxValue, where: Location): number {
        if (typeof v != typeof 1) {
            throw new RuntimeError("value must be a number", where)
        }
        return v as number
    }

    private check_boolean(v: LoxValue, where: Location): boolean {
        if (typeof v != typeof true) {
            throw new RuntimeError("value must be a boolean", where)
        }
        return v as boolean
    }

    visitUnary(e: LoxUnary): LoxValue {
        const val = e.expr.accept(this)
        switch (e.prefix) {
            case TokenType.MINUS:
                return - this.check_number(val, e.location)
            case TokenType.BANG:
                return !this.check_boolean(val, e.location)
        }
        throw new Error("should not be here")
    }

    visitNumber(expr: LoxNumber): LoxValue {
        return expr.value;
    }

    visitBool(expr: LoxBool): LoxValue {
        return expr.value;
    }

    visitNil(expr: LoxNil): LoxValue {
        return null;
    }
}