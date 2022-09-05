//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { AstVisitor, LoxExpr, LoxNumber, LoxBool, LoxNil } from "./ast";

export type LOXValue = number | string | boolean | null

export class Evaluator extends AstVisitor<LOXValue> {
    constructor() {
        super()
    }

    eval(expr: LoxExpr): LOXValue {
        return expr.accept(this)
    }

    visitNumber(expr: LoxNumber): LOXValue {
        return expr.value;
    }

    visitBool(expr: LoxBool): LOXValue {
        return expr.value;
    }

    visitNil(expr: LoxNil): LOXValue {
        return null;
    }
}