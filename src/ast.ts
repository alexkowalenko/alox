//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

abstract class LoxBase {
    abstract accept<T>(visitor: AstVisitor<T>): T
}

export type LoxExpr = LoxLiteral;
export type LoxLiteral = LoxNumber | LoxBool | LoxNil;

export class LoxNumber extends LoxBase {

    constructor(readonly value: number) { super(); }

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitNumber(this)
    }

    toString(): string {
        return "" + this.value
    }
}

export class LoxBool extends LoxBase {
    constructor(readonly value: boolean) { super(); }

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitBool(this)
    }

    toString(): string {
        return this.value ? "true" : "false"
    }
}

export class LoxNil extends LoxBase {
    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitNil(this)
    }

    toString(): string {
        return "nil"
    }
}

export abstract class AstVisitor<T> {
    visitExpr(expr: LoxExpr): T {
        return expr.accept<T>(this)
    }

    visitLiteral(expr: LoxLiteral): T {
        return expr.accept<T>(this)
    }

    visitNumber(expr: LoxNumber): T {
        return undefined as T;
    }

    visitBool(expr: LoxBool): T {
        return undefined as T;
    }

    visitNil(expr: LoxNil): T {
        return undefined as T;
    }
}