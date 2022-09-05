//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { AstVisitor, LoxExpr, LoxNumber, LoxBool, LoxNil } from "./ast";

export type LoxValue = number | string | boolean | null

export class Evaluator extends AstVisitor<LoxValue> {
    constructor() {
        super()
    }

    eval(expr: LoxExpr): LoxValue {
        return expr.accept(this)
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