//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//


import { LoxValue } from "./runtime";
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

export type LoxDeclaration = LoxVar | LoxFunDef | LoxClassDef | LoxStatement;

export class LoxVar extends LoxBase {
    constructor(readonly location: Location, readonly ident: LoxIdentifier) {
        super(location);
    }
    public expr?: LoxExpr;

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitVar(this)
    }
}

export class LoxFunDef extends LoxBase {
    constructor(readonly location: Location, readonly name: LoxIdentifier) {
        super(location);
        this.args = new Array<LoxIdentifier>;
    }
    public args: Array<LoxIdentifier>;
    public method = false;
    public body?: LoxBlock;

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitFun(this)
    }
}

export class LoxClassDef extends LoxBase {
    constructor(readonly location: Location, readonly name: LoxIdentifier) {
        super(location);
        this.methods = new Array;
    }
    public super_class?: LoxIdentifier
    public methods: Array<LoxFunDef>;

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitClass(this)
    }
}

export type LoxStatement = LoxExpr | LoxIf | LoxWhile | LoxFor | LoxPrint | LoxBreak | LoxReturn | LoxBlock;

export class LoxIf extends LoxBase {
    constructor(readonly location: Location, readonly expr: LoxExpr, readonly then: LoxStatement) {
        super(location);
    }
    public else?: LoxStatement;

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitIf(this)
    }
}

export class LoxWhile extends LoxBase {
    constructor(readonly location: Location, readonly expr: LoxExpr, readonly stats: LoxStatement) {
        super(location);
    }

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitWhile(this)
    }
}

export type ForInit = LoxVar | LoxExpr;

export class LoxFor extends LoxBase {
    constructor(readonly location: Location,) {
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
    constructor(readonly location: Location, readonly expr: LoxExpr) {
        super(location);
    }

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitPrint(this)
    }
}

export class LoxBreak extends LoxBase {
    constructor(readonly location: Location, readonly what: TokenType) {
        super(location);
    }

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitBreak(this)
    }
}

export class LoxReturn extends LoxBase {
    constructor(readonly location: Location) {
        super(location);
    }
    public expr?: LoxExpr
    public value: LoxValue = null;

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitReturn(this)
    }
}

export class LoxBlock extends LoxBase {
    constructor(readonly location: Location) {
        super(location);
        this.statements = new Array<LoxDeclaration>
    }

    public statements: Array<LoxDeclaration>;

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitBlock(this)
    }
}

export type LoxExpr = LoxPrimary | LoxUnary | LoxBinary | LoxAssign | LoxSet | LoxGroup | LoxCall | LoxGet;
export type LoxPrimary = LoxIdentifier | LoxLiteral | LoxFunDef | LoxThis | LoxSuper;
export type LoxLiteral = LoxNumber | LoxString | LoxBool | LoxNil;

export class LoxUnary extends LoxBase {
    constructor(readonly location: Location, readonly prefix: TokenType | undefined, readonly expr: LoxExpr) {
        super(location);
    }

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitUnary(this)
    }

    toString(): string {
        return this.prefix + this.expr.toString();
    }
}

export class LoxCall extends LoxBase {
    constructor(readonly location: Location, readonly expr: LoxExpr) {
        super(location);
        this.arguments = new Array<LoxExpr>();
    }
    public arguments: Array<LoxExpr>;

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitCall(this)
    }
}

export class LoxGet extends LoxBase {
    constructor(readonly location: Location, readonly expr: LoxExpr, readonly ident: LoxIdentifier) {
        super(location);
    }

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitGet(this)
    }
}

export class LoxSet extends LoxBase {
    constructor(readonly location: Location, readonly expr: LoxExpr, readonly ident: LoxIdentifier, readonly value: LoxExpr,) {
        super(location);
    }

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitSet(this)
    }
}


export class LoxBinary extends LoxBase {
    constructor(readonly location: Location, readonly operator: TokenType, readonly left: LoxExpr, readonly right: LoxExpr) {
        super(location);
    }

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitBinary(this)
    }

    toString(): string {
        return `(${this.left.toString()} ${this.operator} ${this.right.toString()})`
    }
}

export class LoxAssign extends LoxBase {
    constructor(readonly location: Location, readonly left: LoxExpr, readonly right: LoxExpr) {
        super(location);
    }

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitAssign(this)
    }

    toString(): string {
        return `(${this.left.toString()} = ${this.right.toString()})`
    }
}

export class LoxGroup extends LoxBase {
    constructor(readonly location: Location, readonly expr: LoxExpr) {
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

    constructor(readonly location: Location, readonly id: string) {
        super(location);
    }

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitIdentifier(this)
    }

    toString(): string {
        return this.id
    }
}

export class LoxAnonIdent extends LoxIdentifier {
    static #number = 0;
    constructor(readonly location: Location) {
        super(location, "λ" + LoxAnonIdent.#number++);
    }
}

export class LoxThis extends LoxBase {
    constructor(readonly location: Location) {
        super(location);
    }

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitThis(this)
    }

    toString(): string {
        return "this";
    }
}

export class LoxSuper extends LoxBase {
    constructor(readonly location: Location, readonly method: LoxIdentifier) {
        super(location);
    }

    accept<T>(visitor: AstVisitor<T>): T {
        return visitor.visitSuper(this)
    }

    toString(): string {
        return "super." + this.method.id;
    }
}

export class LoxNumber extends LoxBase {

    constructor(readonly location: Location, readonly value: number) {
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

    constructor(readonly location: Location, readonly value: string) {
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
    constructor(readonly location: Location, readonly value: boolean) {
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
    constructor(readonly location: Location) {
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
 */
export interface AstVisitor<T> {

    visitProgram(prog: LoxProgram): T // Decide what to do here in derived classes

    visitVar(expr: LoxVar): T;
    visitFun(f: LoxFunDef): T;
    visitClass(c: LoxClassDef): T;

    visitIf(expr: LoxIf): T;
    visitWhile(expr: LoxWhile): T;
    visitFor(expr: LoxFor): T;

    visitPrint(expr: LoxPrint): T

    visitBreak(expr: LoxBreak): T;
    visitReturn(e: LoxReturn): T;
    visitBlock(expr: LoxBlock): T;

    visitExpr(expr: LoxExpr): T;
    visitUnary(e: LoxUnary): T;
    visitCall(e: LoxCall): T;
    visitGet(e: LoxGet): T;
    visitSet(e: LoxSet): T

    visitAssign(e: LoxAssign): T;
    visitBinary(e: LoxBinary): T;
    visitGroup(e: LoxGroup): T;

    visitThis(e: LoxThis): T;
    visitSuper(e: LoxSuper): T;
    visitIdentifier(e: LoxIdentifier): T;
    visitLiteral(expr: LoxLiteral): T;
    visitNumber(expr: LoxNumber): T;
    visitString(expr: LoxString): T;
    visitBool(expr: LoxBool): T;
    visitNil(expr: LoxNil): T;
}
