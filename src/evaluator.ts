//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { AstVisitor, LoxExpr, LoxNumber, LoxBool, LoxNil, LoxUnary, LoxBinary, LoxString } from "./ast";
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
        if (typeof v != "number") {
            throw new RuntimeError("value must be a number", where)
        }
        return v as number
    }

    private check_string(v: LoxValue, where: Location): string {
        if (typeof v != "string") {
            throw new RuntimeError("value must be a string", where)
        }
        return v as string
    }

    private check_boolean(v: LoxValue, where: Location): boolean {
        if (typeof v != "boolean") {
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
        throw new Error(`unhandled unary operator ${e.prefix}`)
    }

    visitBinary(e: LoxBinary): LoxValue {
        const left = e.left.accept(this)
        const right = e.right.accept(this)
        switch (e.operator) {
            case TokenType.PLUS:
                if (typeof left === "number")
                    return this.check_number(left, e.left.location) + this.check_number(right, e.right.location)
                else if (typeof left === "string")
                    return this.check_string(left, e.left.location) + this.check_string(right, e.right.location)
                else {
                    throw new RuntimeError(`can't apply ${e.operator} to ${left}`, e.left.location)
                }

            case TokenType.MINUS:
                return this.check_number(left, e.left.location) - this.check_number(right, e.right.location)
        }
        throw new Error(`unhandled binary operator ${e.operator}`)
    }

    visitNumber(expr: LoxNumber): LoxValue {
        return expr.value;
    }

    visitString(expr: LoxString): LoxValue {
        return expr.value
    }

    visitBool(expr: LoxBool): LoxValue {
        return expr.value;
    }

    visitNil(expr: LoxNil): LoxValue {
        return null;
    }
}