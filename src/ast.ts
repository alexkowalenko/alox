//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

export type LoxExpr = LoxNumber;

export class LoxNumber {
    constructor(readonly value: number) { }

    toString(): string {
        return "" + this.value
    }
}

export interface AstVisitor {
    visitExpr(expr: LoxExpr): void
    visitNumber(expr: LoxNumber): void
}