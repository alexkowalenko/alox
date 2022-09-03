//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

export type LoxExpr = LoxLiteral;
export type LoxLiteral = LoxNumber | LoxBool | LoxNil;
export class LoxNumber {
    constructor(readonly value: number) { }

    toString(): string {
        return "" + this.value
    }
}

export class LoxBool {
    constructor(readonly value: boolean) { }

    toString(): string {
        return this.value ? "true" : "false"
    }
}

export class LoxNil {

    toString(): string {
        return "nil"
    }
}

export interface AstVisitor {
    visitExpr(expr: LoxExpr): void
    visitLiteral(expr: LoxLiteral): void
    visitNumber(expr: LoxNumber): void
    visitBool(expr: LoxBool): void
    visitNil(expr: LoxNil): void
}