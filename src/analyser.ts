//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { AstVisitor, LoxBlock, LoxBool, LoxBreak, LoxCall, LoxDeclaration, LoxExpr, LoxFor, LoxFun, LoxIdentifier, LoxIf, LoxNil, LoxNumber, LoxProgram, LoxReturn, LoxString, LoxVar, LoxWhile, LoxBinary, LoxUnary, LoxLiteral, LoxClassDef, LoxGet, LoxSet, LoxAssign } from "./ast";
import { ParseError } from "./error";
import { Evaluator } from "./evaluator";
import { TokenType } from "./token";

export class Analyser extends AstVisitor<void> {

    constructor(private readonly evaluator: Evaluator) {
        super();
        this.scopes = new Array;
        // for globals
        this.begin_scope();
    }
    private enclosing_loop = 0;

    private scopes: Array<Map<string, boolean>>;

    private begin_scope() {
        this.scopes.push(new Map<string, boolean>);
    }

    private end_scope() {
        this.scopes.pop();
    }

    private declare(name: string) {
        // console.log(`declare name: ${name}`)
        this.scopes.at(-1)?.set(name, false)
    }

    public define(name: string) {
        // console.log(`define name: ${name}`)
        this.scopes.at(-1)?.set(name, true)
    }

    private resolve(name: string, expr: LoxExpr) {
        // console.log(`resolve ${name}`)
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            if (this.scopes[i].has(name)) {
                let depth = this.scopes.length - 1 - i;
                //console.log(`resolve: ${name} - depth ${depth}`)
                this.evaluator.resolve(expr, depth)
                return
            }
        }
        // console.log(`could not resolve ${name}`)
    }

    public analyse(prog: LoxProgram) {
        prog.accept(this);
    }

    visitProgram(prog: LoxProgram): void {
        for (const s of prog.statements) {
            s.accept(this);
        }
    }

    visitVar(expr: LoxVar): void {
        this.declare(expr.ident.id);
        expr.expr?.accept(this);
        this.define(expr.ident.id);
    }

    visitFun(f: LoxFun): void {
        if (f.name !== undefined) {
            this.declare(f.name.id);
            this.define(f.name.id);
        }
        this.begin_scope();
        for (const param of f.args) {
            this.declare(param.id);
            this.define(param.id);
        }
        f.body!.accept(this);
        this.end_scope();
    }

    visitClass(c: LoxClassDef): void {
        this.declare(c.name.id);
        this.define(c.name.id);
    }

    visitIf(expr: LoxIf): void {
        expr.expr.accept(this);
        expr.then.accept(this);
        expr.else?.accept(this);
    }

    visitWhile(expr: LoxWhile): void {
        expr.expr.accept(this);
        this.enclosing_loop++;
        expr.stats.accept(this);
        this.enclosing_loop--;
    }

    visitFor(expr: LoxFor): void {
        this.begin_scope();
        expr.init?.accept(this);
        expr.cond?.accept(this);
        expr.iter?.accept(this);
        this.enclosing_loop++;
        expr.stat?.accept(this);
        this.enclosing_loop--;
        this.end_scope();
    }

    visitBreak(expr: LoxBreak): void {
        if (this.enclosing_loop == 0) {
            throw new ParseError(`no enclosing loop statement for ${expr.what}`, expr.location)
        }
    }

    visitReturn(e: LoxReturn): void {
        e.expr?.accept(this);
    }

    visitBlock(expr: LoxBlock): void {
        this.begin_scope();
        for (const stat of expr.statements) {
            stat.accept(this)
        }
        this.end_scope();
    }

    visitAssign(e: LoxAssign): void {
        e.right.accept(this)
        const v = e.left as LoxIdentifier;
        this.resolve(v.id, e.left)
    }

    visitUnary(e: LoxUnary): void {
        e.expr.accept(this);
    }

    visitCall(e: LoxCall): void {
        e.expr.accept(this);
        for (const arg of e.arguments) {
            arg.accept(this)
        }
    }

    visitGet(e: LoxGet): void {
        e.expr.accept(this);
    }

    visitSet(e: LoxSet): void {
        e.value.accept(this);
        e.expr.accept(this);
    }

    visitBinary(e: LoxBinary): void {
        e.left.accept(this)
        e.right.accept(this)
    }

    visitIdentifier(e: LoxIdentifier): void {
        if (this.scopes.at(-1)?.get(e.id) === false) {
            throw new ParseError(`can't have local variable ${e.id} in its own initializer`, e.location)
        }
        this.resolve(e.id, e)
    }

    visitLiteral(expr: LoxLiteral): void {
    }

    visitNumber(expr: LoxNumber): void {
    }

    visitString(expr: LoxString): void {
    }

    visitBool(expr: LoxBool): void {
    }

    visitNil(expr: LoxNil): void {
    }
}