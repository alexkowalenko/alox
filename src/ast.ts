//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

abstract class LoxBase {
    abstract accept(visitor: AstVisitor): void
}

export type LoxExpr = LoxLiteral;
export type LoxLiteral = LoxNumber | LoxBool | LoxNil;

export class LoxNumber extends LoxBase {

    constructor(readonly value: number) { super(); }

    accept(visitor: AstVisitor): void {
        visitor.visitNumber(this)
    }

    toString(): string {
        return "" + this.value
    }
}

export class LoxBool extends LoxBase {
    constructor(readonly value: boolean) { super(); }

    accept(visitor: AstVisitor): void {
        visitor.visitBool(this)
    }

    toString(): string {
        return this.value ? "true" : "false"
    }
}

export class LoxNil extends LoxBase {
    accept(visitor: AstVisitor): void {
        visitor.visitNil(this)
    }

    toString(): string {
        return "nil"
    }
}

export abstract class AstVisitor {
    visitExpr(expr: LoxExpr): void {
        expr.accept(this)
    }

    visitLiteral(expr: LoxLiteral): void {
        expr.accept(this);
    }

    visitNumber(expr: LoxNumber): void { }
    visitBool(expr: LoxBool): void { }
    visitNil(expr: LoxNil): void { }
}