//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { AstVisitor, LoxExpr, LoxNumber, LoxBool, LoxNil, LoxUnary, LoxBinary, LoxString, LoxProgram, LoxPrint, LoxIdentifier, LoxVar, LoxBlock, LoxIf, LoxWhile, LoxFor, LoxBreak, LoxCall, LoxFunDef, LoxReturn, LoxClassDef, LoxGet, LoxSet, LoxAssign, LoxThis, LoxSuper, LoxGroup, LoxLiteral } from "../ast";
import { RuntimeError } from "../error";
import { Options } from "../interpreter";
import { Printer } from "../printer";
import { LoxCallable, LoxValue, LoxFunction, LoxClass, LoxInstance, pretty_print, check_number, check_string, truthy, Function_Evaluator, Evaluator } from "../runtime";
import { SymbolTable } from "../symboltable";
import { TokenType } from "../token";

import os from "os";


export class TreeEvaluator implements AstVisitor<LoxValue>, Evaluator, Function_Evaluator {

    constructor(public symboltable: SymbolTable<LoxValue>, private readonly options: Options) {
    }

    private locals: Map<LoxExpr, number> = new Map;

    eval(expr: LoxExpr): LoxValue {
        return expr.accept(this)
    }

    /**
     * 
     * @param prog program to execute
     * @returns 
     */
    visitProgram(prog: LoxProgram): LoxValue {
        let val = null
        for (const stat of prog.statements) {
            try {
                val = stat.accept(this)
            } catch (e) {
                if (e instanceof LoxReturn) {
                    throw new RuntimeError(`no enclosing function to return from`, e.location)
                }
                throw e; // rethrow
            }
        }
        return val
    }

    visitVar(v: LoxVar): LoxValue {
        let val = null;
        if (v.expr) {
            val = v.expr.accept(this)
        }
        this.symboltable.set(v.ident.id, val);
        return val;
    }

    visitFun(f: LoxFunDef) {
        const val = new LoxFunction(f, this.symboltable, false);
        if (f.name !== undefined) {
            this.symboltable.set(f.name?.id, val);
        }
        return val;
    }

    visitClass(c: LoxClassDef): LoxValue {
        const cls = new LoxClass(c);
        if (c.super_class) {
            let super_class = c.super_class.accept(this);
            if (!(super_class instanceof LoxClass)) {
                throw new RuntimeError(`superclass of ${c.name} must be a class`, c.super_class.location)
            }
            cls.super_class = super_class as LoxClass;
        }
        this.symboltable.set(cls.name, cls);

        let prev: SymbolTable<LoxValue>;
        if (c.super_class) {
            prev = this.symboltable;
            this.symboltable = new SymbolTable(this.symboltable);
            this.symboltable.set("super", cls.super_class!);
        }

        for (let m of c.methods) {
            let f = new LoxFunction(m, this.symboltable, m.name!.id === "init");
            cls.methods.set(m.name!.id, f);
        }

        if (c.super_class) {
            this.symboltable = prev!
        }

        return cls;
    }


    visitIf(expr: LoxIf): LoxValue {
        const val = expr.expr.accept(this);
        if (truthy(val)) {
            return expr.then.accept(this)
        }
        if (expr.else) {
            return expr.else?.accept(this);
        }
        return null
    }

    visitWhile(e: LoxWhile): LoxValue {
        let v = e.expr.accept(this);
        let stat: LoxValue = null;
        while (truthy(v)) {
            try {
                stat = e.stats.accept(this)
            }
            catch (ex) {
                if (!(ex instanceof LoxBreak)) {
                    throw ex
                }
                if (ex.what == TokenType.BREAK) {
                    break
                }
                // else continue
            }
            v = e.expr.accept(this);
        }
        return stat
    }

    visitFor(e: LoxFor): LoxValue {
        // Set up new environment
        let prev = this.symboltable;
        this.symboltable = new SymbolTable(prev);

        try {
            if (e.init) {
                e.init.accept(this);
            }
            let val: LoxValue = true;
            if (e.cond) {
                val = e.cond.accept(this);
            }
            //console.log(`for cond = ${val}`)
            var ret: LoxValue = null;
            while (truthy(val)) {
                if (e.stat) {
                    try {
                        ret = e.stat.accept(this);
                    } catch (ex) {
                        if (!(ex instanceof LoxBreak)) {
                            throw ex
                        }
                        if (ex.what == TokenType.BREAK) {
                            break
                        }
                        // else continue
                    }
                }
                if (e.iter) {
                    e.iter.accept(this);
                }
                if (e.cond) {
                    val = e.cond.accept(this);
                }
                // console.log(`for cond = ${val} : ${this.truthy(val)}`)
            }
        } finally {
            // Restore environment
            this.symboltable = prev;
        }
        return ret;
    }

    visitPrint(p: LoxPrint): LoxValue {
        let val = p.expr.accept(this)
        if (val === null) {
            this.options.output.write("nil" + os.EOL)
        } else {
            this.options.output.write(val.toString() + os.EOL)
        }
        return val
    }

    visitBreak(e: LoxBreak): LoxValue {
        throw e
    }

    visitReturn(e: LoxReturn): LoxValue {
        if (e.expr) {
            e.value = e.expr.accept(this);
        }
        throw e;
    }

    visitBlock(expr: LoxBlock): LoxValue {
        let prev = this.symboltable;
        this.symboltable = new SymbolTable(prev);
        let result: LoxValue = null;
        try {
            for (const stat of expr.statements) {
                result = stat.accept(this)
            }
        }
        finally {
            this.symboltable = prev;
        }
        return result;
    }

    visitExpr(expr: LoxExpr): LoxValue {
        return expr.accept(this);
    }

    visitGroup(e: LoxGroup): LoxValue {
        return e.expr.accept(this);
    }

    visitUnary(e: LoxUnary): LoxValue {
        const val = e.expr.accept(this)
        switch (e.prefix) {
            case TokenType.MINUS:
                return - check_number(val, e.location)
            case TokenType.BANG:
                return !truthy(val)
        }
        throw new RuntimeError(`${e.prefix} not defined as prefix operator`, e.location);
    }

    visitCall(e: LoxCall): LoxValue {
        const val = e.expr.accept(this)
        if (val instanceof LoxCallable) {
            let fun = val as LoxCallable;
            if (fun.arity() != e.arguments.length) {
                throw new RuntimeError(`function ${new Printer().print(e.expr)} called with ${e.arguments.length} arguments, expecting ${fun.arity()}`,
                    e.location)
            }
            let args = new Array<LoxValue>;
            for (let a of e.arguments) {
                args.push(a.accept(this));
            }
            return (val as LoxCallable).call(this, args);

        } else {
            throw new RuntimeError(`can't call ${new Printer().print(e.expr)}`, e.expr.location)
        }
    }

    public call_function(f: LoxFunction, args: readonly LoxValue[]): LoxValue {
        let prev = this.symboltable
        this.symboltable = new SymbolTable(f.closure);
        for (let i = 0; i < args.length; i++) {
            this.symboltable.set(f.fun.args[i].id, args[i])
        }
        let val: LoxValue = null;
        try {
            val = this.visitBlock(f.fun.body!)
        }
        catch (e) {
            if (e instanceof LoxReturn) {
                val = e.value;
            } else {
                throw e;
            }
        }
        finally {
            this.symboltable = prev
        }
        if (f.initializer) {
            return f.closure.get_at(0, "this")!;
        }
        return val;
    }

    visitGet(e: LoxGet): LoxValue {
        let obj = e.expr.accept(this);
        if (obj instanceof LoxInstance) {
            let val = obj.get(e.ident.id)
            if (val !== undefined) {
                return val;
            }

            // try method
            let method = obj.cls.findMethod(e.ident.id)
            if (method !== undefined) {
                return method.bind(obj);
            }
            throw new RuntimeError(`undefined property ${e.ident.id}`, e.ident.location)
        }
        throw new RuntimeError("only objects have properties", e.location)
    }

    visitSet(e: LoxSet): LoxValue {
        let obj = e.expr.accept(this);
        if (obj instanceof LoxInstance) {
            let val = e.value.accept(this)
            obj.set(e.ident.id, val)
            return val;
        }
        throw new RuntimeError("only objects have properties", e.location)
    }

    visitBinary(e: LoxBinary): LoxValue {
        if (e.operator === TokenType.AND || e.operator === TokenType.OR) {
            return this.do_logical(e)
        }

        const left = e.left.accept(this)
        const right = e.right.accept(this)
        switch (e.operator) {
            // The Four Operators of the Arithmetic.
            case TokenType.PLUS:
                if (typeof left === "number")
                    return left + check_number(right, e.right.location)
                else if (typeof left === "string")
                    return check_string(left, e.left.location) + check_string(right, e.right.location)
                else {
                    throw new RuntimeError(`can't apply ${e.operator} to ${pretty_print(left)}`, e.left.location)
                }

            case TokenType.MINUS:
                return check_number(left, e.left.location) - check_number(right, e.right.location)

            case TokenType.ASTÉRIX:
                return check_number(left, e.left.location) * check_number(right, e.right.location)

            case TokenType.SLASH:
                return check_number(left, e.left.location) / check_number(right, e.right.location)

            // Relational
            case TokenType.LESS:
                return check_number(left, e.left.location) < check_number(right, e.right.location)
            case TokenType.LESS_EQUAL:
                return check_number(left, e.left.location) <= check_number(right, e.right.location)
            case TokenType.GREATER:
                return check_number(left, e.left.location) > check_number(right, e.right.location)
            case TokenType.GREATER_EQUAL:
                return check_number(left, e.left.location) >= check_number(right, e.right.location)
            case TokenType.EQUAL_EQUAL:
                return left === right // strict non-javascript equals
            case TokenType.BANG_EQUAL:
                return left !== right
        }
        throw new RuntimeError(`unhandled binary operator ${e.operator}`, e.location)
    }

    visitAssign(e: LoxAssign): LoxValue {
        // check if left hand expression is a lvalue - assignable
        if (!(e.left instanceof LoxIdentifier)) {
            throw new RuntimeError(`can't assign to ${e.left.toString()}`, e.left.location)
        }
        let var_name = e.left.id;
        //console.log(`assign to ${var_name}.`)
        //this.symboltable.dump();
        let val = e.right.accept(this);
        if (this.locals.has(e.left)) {
            let depth = this.locals.get(e.left)
            if (depth !== undefined) {
                this.symboltable.assign_at(depth, var_name, val)
                return val
            }
        }
        throw new RuntimeError(`undefined variable ${e.left.toString()}`, e.left.location)
    }

    private do_logical(e: LoxBinary) {
        const left = e.left.accept(this);
        if (e.operator === TokenType.OR) {
            if (truthy(left))
                return left
        } else {
            if (!truthy(left))
                return left
        }
        return e.right.accept(this);
    }

    private lookup_variable(e: LoxExpr): LoxValue {
        // console.log("eval id: %s", e.id)
        if (this.locals.has(e)) {
            let depth = this.locals.get(e)
            if (depth !== undefined) {
                let val = this.symboltable.get_at(depth, e.toString())
                if (val !== undefined) {
                    return val;
                }
            }
        }

        // last effort to resolve function names used before declared,
        // LOX doesn't have a forward statement. 
        let val = this.symboltable.get(e.toString());
        if (val !== undefined) {
            return val;
        }
        throw new RuntimeError(`identifier ${e.toString()} not found`, e.location);
    }

    visitLiteral(expr: LoxLiteral): LoxValue {
        return expr.accept(this);
    }

    visitIdentifier(e: LoxIdentifier): LoxValue {
        return this.lookup_variable(e);
    }

    visitThis(e: LoxThis): LoxValue {
        return this.lookup_variable(e);
    }

    visitSuper(e: LoxSuper): LoxValue {
        let distance = this.locals.get(e);
        // console.log(`super distance = ${distance}`);
        let super_class = this.symboltable.get_at(distance!, "super") as LoxClass;
        if (!super_class) {
            throw new RuntimeError(`can't find superclass ${e}`, e.method.location)
        }
        //console.log(`super = ${super_class}`);
        let obj: LoxInstance = this.symboltable.get_at(distance! - 1, "this")! as LoxInstance;
        let method = super_class.findMethod(e.method.id);
        if (method == undefined) {
            throw new RuntimeError(`undefined property on super ${e.method.id}`, e.method.location)
        }
        return method?.bind(obj) as LoxValue
    }

    visitNumber(expr: LoxNumber): LoxValue {
        return expr.value;
    }

    visitString(expr: LoxString): LoxValue {
        return expr.value
    }

    visitBool(expr: LoxBool): LoxValue {
        return expr.value;
    }

    visitNil(expr: LoxNil): LoxValue {
        return null;
    }

    public resolve(expr: LoxExpr, depth: number) {
        this.locals.set(expr, depth)
    }

}