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

export class LoxProgram extends LoxBase {
    constructor() {
        super(new Location());
        this.statements = new Array<LoxDeclaration>
    }

    public statements: Array<LoxDeclaration>;

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitProgram(this)
    }

    toString(): string {
        let result = "";
        for (let stat of this.statements) {
            result += stat.toString() + ';';
        }
        return result;
    }
}

export type LoxDeclaration = LoxVar | LoxStatement;

export class LoxVar extends LoxBase {
    constructor(location: Location, readonly ident: LoxIdentifier, readonly expr: LoxExpr) {
        super(location);
    }

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitVar(this)
    }

    toString(): string {
        return "var " + this.ident.toString() + " = " + this.expr.toString();
    }
}

export type LoxStatement = LoxExpr | LoxPrint;

export class LoxPrint extends LoxBase {
    constructor(location: Location, readonly expr: LoxExpr) {
        super(location);
    }

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitPrint(this)
    }

    toString(): string {
        return "print " + this.expr.toString();
    }
}

export type LoxExpr = LoxPrimary | LoxUnary | LoxBinary | LoxGroup;
export type LoxPrimary = LoxIdentifier | LoxLiteral;
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

export class LoxIdentifier extends LoxBase {

    constructor(location: Location, readonly id: string) {
        super(location);
    }

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitIdentifier(this)
    }

    toString(): string {
        return this.id
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
        return '"' + this.value + '"'
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

    abstract visitProgram(prog: LoxProgram): T // Decide what to do here in derived classes

    visitVar(expr: LoxVar): T {
        expr.ident.accept<T>(this)
        return expr.expr.accept<T>(this)
    }

    visitPrint(expr: LoxPrint): T {
        return expr.expr.accept<T>(this)
    }

    visitExpr(expr: LoxExpr): T {
        return expr.accept<T>(this)
    }

    visitUnary(e: LoxUnary): T {
        return e.expr.accept<T>(this)
    }

    visitBinary(e: LoxBinary): T {
        e.left.accept<T>(this)
        return e.right.accept<T>(this)
    }

    visitGroup(e: LoxGroup): T {
        return e.expr.accept<T>(this)
    }

    abstract visitIdentifier(e: LoxIdentifier): T;

    visitLiteral(expr: LoxLiteral): T {
        return expr.accept<T>(this)
    }

    abstract visitNumber(expr: LoxNumber): T;
    abstract visitString(expr: LoxString): T;
    abstract visitBool(expr: LoxBool): T;
    abstract visitNil(expr: LoxNil): T;
}