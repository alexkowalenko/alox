//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { AstVisitor, LoxBlock, LoxBool, LoxBreak, LoxCall, LoxDeclaration, LoxExpr, LoxFor, LoxFun, LoxIdentifier, LoxIf, LoxNil, LoxNumber, LoxProgram, LoxReturn, LoxString, LoxVar, LoxWhile, LoxBinary, LoxUnary, LoxLiteral, LoxClassDef, LoxGet, LoxSet, LoxAssign, LoxThis, LoxSuper } from "./ast";
import { ParseError } from "./error";
import { Evaluator } from "./evaluator";
import { TokenType } from "./token";

const enum FunctionType {
    NONE,
    FUNCTION,
    INITIALIZER,
    METHOD
}

const enum ClassType {
    NONE,
    CLASS,
    SUBCLASS,
}

export class Analyser extends AstVisitor<void> {

    constructor(private readonly evaluator: Evaluator) {
        super();
        this.scopes = new Array;
        // for globals
        this.begin_scope();
    }
    private enclosing_loop = 0;
    private scopes: Array<Map<string, boolean>>;
    private current_function = FunctionType.NONE;
    private current_class = ClassType.NONE;

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

    private resolve_function(f: LoxFun, type: FunctionType = FunctionType.FUNCTION) {
        // Swap the current function type with the previous.
        let enclosing_function = this.current_function;
        this.current_function = type;

        this.begin_scope();
        for (const param of f.args) {
            this.declare(param.id);
            this.define(param.id);
        }
        f.body!.accept(this);
        this.end_scope();

        this.current_function = enclosing_function;
    }

    visitFun(f: LoxFun): void {
        if (f.name !== undefined) {
            this.declare(f.name.id);
            this.define(f.name.id);
        }
        this.resolve_function(f, FunctionType.FUNCTION)
    }

    visitClass(c: LoxClassDef): void {
        let enclosing_class = this.current_class;
        this.current_class = ClassType.CLASS;

        this.declare(c.name.id);
        this.define(c.name.id);

        if (c.name.id === c.super_class?.id) {
            throw new ParseError("a class can't inherit from itself", c.super_class?.location)
        }

        if (c.super_class) {
            this.current_class = ClassType.SUBCLASS
            this.resolve(c.super_class.id, c.super_class)
            this.begin_scope();
            this.define("super")
        }

        this.begin_scope();
        this.define("this");

        for (const m of c.methods) {
            // Resolve methods 
            let declaration = FunctionType.METHOD;
            if (m.name!.id === "init") {
                declaration = FunctionType.INITIALIZER;
            }
            this.resolve_function(m, declaration)
        }
        this.end_scope();

        if (c.super_class) {
            this.end_scope();
        }

        this.current_class = enclosing_class;
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
        if (this.current_function == FunctionType.NONE) {
            throw new ParseError(`no enclosing function to return from`, e.location)
        }
        if (this.current_function == FunctionType.INITIALIZER && e.expr) {
            throw new ParseError(`can't return a value from an initializer`, e.location)
        }
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
        if (e.left instanceof LoxThis) {
            throw new ParseError(`invalid assignment target this`, e.location)
        }
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
        this.resolve(e.id, e)
    }

    visitThis(e: LoxThis): void {
        if (this.current_class == ClassType.NONE) {
            throw new ParseError(`can't use 'this' outside of a class`, e.location)
        }
        this.resolve(TokenType.THIS, e);
    }

    visitSuper(e: LoxSuper): void {
        if (this.current_class == ClassType.NONE) {
            throw new ParseError("can't use 'super' outside of a class", e.location);
        } else if (this.current_class == ClassType.CLASS) {
            throw new ParseError("can't use 'super' in a class with no superclass", e.location);
        }
        this.resolve(TokenType.SUPER, e);
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