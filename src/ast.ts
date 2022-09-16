//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { Evaluator, LoxValue } from "./evaluator";
import { SymbolTable } from "./symboltable";
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
}

export type LoxDeclaration = LoxVar | LoxFun | LoxStatement;

export class LoxVar extends LoxBase {
    constructor(location: Location, readonly ident: LoxIdentifier) {
        super(location);
    }
    public expr?: LoxExpr;

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitVar(this)
    }
}

export class LoxFun extends LoxBase {
    constructor(location: Location, readonly name: LoxIdentifier) {
        super(location);
        this.args = new Array<LoxIdentifier>;
    }
    public args: Array<LoxIdentifier>;
    public body?: LoxBlock;

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitFun(this)
    }
}

export type LoxStatement = LoxExpr | LoxIf | LoxWhile | LoxFor | LoxPrint | LoxBreak | LoxReturn | LoxBlock;

export class LoxIf extends LoxBase {
    constructor(location: Location, readonly expr: LoxExpr, readonly then: LoxStatement) {
        super(location);
    }
    public else?: LoxStatement;

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitIf(this)
    }
}

export class LoxWhile extends LoxBase {
    constructor(location: Location, readonly expr: LoxExpr, readonly stats: LoxStatement) {
        super(location);
    }

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitWhile(this)
    }
}

export type ForInit = LoxVar | LoxExpr;

export class LoxFor extends LoxBase {
    constructor(location: Location,) {
        super(location);
    }
    public init?: ForInit;
    public cond?: LoxExpr;
    public iter?: LoxExpr;
    public stat: LoxStatement | undefined;

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitFor(this)
    }
}


export class LoxPrint extends LoxBase {
    constructor(location: Location, readonly expr: LoxExpr) {
        super(location);
    }

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitPrint(this)
    }
}

export class LoxBreak extends LoxBase {
    constructor(location: Location, readonly what: TokenType) {
        super(location);
    }

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitBreak(this)
    }
}

export class LoxReturn extends LoxBase {
    constructor(location: Location) {
        super(location);
    }
    public expr?: LoxExpr
    public value: LoxValue = null;

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitReturn(this)
    }
}

export class LoxBlock extends LoxBase {
    constructor(location: Location) {
        super(location);
        this.statements = new Array<LoxDeclaration>
    }

    public statements: Array<LoxDeclaration>;

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitBlock(this)
    }
}

export type LoxExpr = LoxPrimary | LoxUnary | LoxBinary | LoxGroup;
export type LoxPrimary = LoxIdentifier | LoxLiteral | LoxFun;
export type LoxLiteral = LoxNumber | LoxString | LoxBool | LoxNil;

export class LoxUnary extends LoxBase {
    constructor(location: Location, readonly prefix: TokenType | undefined, readonly expr: LoxExpr) {
        super(location);
    }
    public call?: LoxCall;

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitUnary(this)
    }

    toString(): string {
        return this.prefix + this.expr.toString();
    }
}

export class LoxCall extends LoxBase {
    constructor(location: Location,) {
        super(location);
        this.arguments = new Array<LoxExpr>();
    }
    public arguments: Array<LoxExpr>;

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitCall(this)
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

    abstract visitVar(expr: LoxVar): T;
    abstract visitFun(f: LoxFun): T;

    abstract visitIf(expr: LoxIf): T;
    abstract visitWhile(expr: LoxWhile): T;
    abstract visitFor(expr: LoxFor): T;

    visitPrint(expr: LoxPrint): T {
        return expr.expr.accept<T>(this)
    }

    abstract visitBreak(expr: LoxBreak): T;
    abstract visitReturn(e: LoxReturn): T;
    abstract visitBlock(expr: LoxBlock): T;

    visitExpr(expr: LoxExpr): T {
        return expr.accept<T>(this)
    }

    visitUnary(e: LoxUnary): T {
        return e.expr.accept<T>(this)
    }

    abstract visitCall(e: LoxCall): T;

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

export abstract class LoxCallable {
    abstract call(interp: Evaluator, args: Array<LoxValue>): LoxValue;

    toString(): string {
        return '<native fn>'
    }
}