//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { Location, TokenType } from "./token"

abstract class LoxBase {
    constructor(public readonly location: Location) { };

    abstract accept<T>(visitor: AstVisitor<T>): T
}

export type LoxExpr = LoxLiteral | LoxUnary | LoxBinary | LoxGroup;
export type LoxLiteral = LoxNumber | LoxString | LoxBool | LoxNil;

export class LoxUnary extends LoxBase {
    constructor(location: Location, readonly prefix: TokenType, readonly expr: LoxExpr) {
        super(location);
    }

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitUnary(this)
    }

    toString(): string {
        return this.prefix + this.expr.toString();
    }
}

export class LoxBinary extends LoxBase {
    constructor(location: Location, readonly operator: TokenType, readonly left: LoxExpr, readonly right: LoxExpr) {
        super(location);
    }

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitBinary(this)
    }

    toString(): string {
        return `(${this.left.toString()} ${this.operator} ${this.right.toString()})`
    }
}

export class LoxGroup extends LoxBase {
    constructor(location: Location, readonly expr: LoxExpr) {
        super(location);
    }

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitGroup(this)
    }

    toString(): string {
        return "( " + this.expr.toString() + " )"
    }
}
export class LoxNumber extends LoxBase {

    constructor(location: Location, readonly value: number) {
        super(location);
    }

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitNumber(this)
    }

    toString(): string {
        return "" + this.value
    }
}

export class LoxString extends LoxBase {

    constructor(location: Location, readonly value: string) {
        super(location);
    }

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitString(this)
    }

    toString(): string {
        return this.value
    }
}


export class LoxBool extends LoxBase {
    constructor(location: Location, readonly value: boolean) {
        super(location);
    }

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitBool(this)
    }

    toString(): string {
        return this.value ? "true" : "false"
    }
}

export class LoxNil extends LoxBase {
    constructor(location: Location) {
        super(location)
    }

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitNil(this)
    }

    toString(): string {
        return "nil"
    }
}

/**
 * Visitor class for traversing the AST
 * 
 * Never call return e.accept<T>(this) in a method  which is class not in a union,
 * as this leads to a infinite call back and forth between the visitor and the AST.
 */
export abstract class AstVisitor<T> {
    visitExpr(expr: LoxExpr): T {
        return expr.accept<T>(this)
    }

    visitUnary(e: LoxUnary): T {
        return e.expr.accept<T>(this)
    }

    visitBinary(e: LoxBinary): T {
        return e.left.accept<T>(this)
        return e.right.accept<T>(this)
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

    visitString(expr: LoxString): T {
        return undefined as T;
    }

    visitBool(expr: LoxBool): T {
        return undefined as T;
    }

    visitNil(expr: LoxNil): T {
        return undefined as T;
    }
}