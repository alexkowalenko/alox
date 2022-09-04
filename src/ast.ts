//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { TokenType } from "./token"

abstract class LoxBase {
    abstract accept<T>(visitor: AstVisitor<T>): T
}

export type LoxExpr = LoxLiteral | LoxUnary | LoxBinary | LoxGroup;
export type LoxLiteral = LoxNumber | LoxBool | LoxNil;

export class LoxUnary extends LoxBase {
    constructor(readonly prefix: TokenType, readonly expr: LoxExpr) { super(); }

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitUnary(this)
    }

    toString(): string {
        return this.prefix + this.expr.toString();
    }
}

export class LoxBinary extends LoxBase {
    constructor(readonly operator: TokenType, readonly left: LoxExpr, readonly right: LoxExpr) { super(); }

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitBinary(this)
    }

    toString(): string {
        return `(${this.left.toString()} ${this.operator} ${this.right.toString()})`
    }
}

export class LoxGroup extends LoxBase {
    constructor(readonly expr: LoxExpr) { super(); }

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitGroup(this)
    }

    toString(): string {
        return "( " + this.expr.toString() + " )"
    }
}
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

    visitUnary(e: LoxUnary): T {
        return e.accept<T>(this)
    }

    visitBinary(e: LoxBinary): T {
        return e.accept<T>(this)
    }

    visitGroup(e: LoxGroup): T {
        return e.expr.accept<T>(this)
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