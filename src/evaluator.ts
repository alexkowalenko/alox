//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { AstVisitor, LoxExpr, LoxNumber, LoxBool, LoxNil, LoxUnary, LoxBinary, LoxString, LoxProgram, LoxPrint, LoxIdentifier, LoxVar, LoxBlock, LoxIf, LoxWhile, LoxFor, LoxBreak, LoxCall, LoxCallable, LoxFun, LoxReturn } from "./ast";
import { RuntimeError } from "./error";
import { SymbolTable } from "./symboltable";
import { Location, TokenType } from "./token";

export type LoxValue = number | string | boolean | null | LoxCallable

class LoxFunction extends LoxCallable {

    constructor(readonly fun: LoxFun) {
        super();
    }

    call(interp: Evaluator, args: LoxValue[]): LoxValue {
        if (this.fun.args.length != args.length) {
            throw new RuntimeError(`function ${this.fun.name} called with ${args.length} arguments, expecting ${this.fun.args.length}`,
                this.fun.location)
        }
        let prev = interp.symboltable;
        interp.symboltable = new SymbolTable(interp.symboltable);
        for (let i = 0; i < args.length; i++) {
            interp.symboltable.set(this.fun.args[i].id, args[i])
        }
        let val: LoxValue = null;
        try {
            val = interp.visitBlock(this.fun.body!)
        }
        catch (e) {
            if (e instanceof LoxReturn) {
                val = e.value;
            } else {
                throw e;
            }
        }
        finally {
            interp.symboltable = prev;
        }
        return val;
    }

    toString(): string {
        return `<fn ${this.fun.name}>`
    }
}

function check_number(v: LoxValue, where: Location): number {
    if (typeof v != "number") {
        throw new RuntimeError("value must be a number", where)
    }
    return v
}

function check_string(v: LoxValue, where: Location): string {
    if (typeof v != "string") {
        throw new RuntimeError("value must be a string", where)
    }
    return v
}

function check_boolean(v: LoxValue, where: Location): boolean {
    if (typeof v != "boolean") {
        throw new RuntimeError("value must be a boolean", where)
    }
    return v
}

export class Evaluator extends AstVisitor<LoxValue> {

    constructor(public symboltable: SymbolTable<LoxValue>) {
        super()
    }

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
        var val = null;
        if (v.expr) {
            val = v.expr.accept(this)
        }
        if (!this.symboltable.has_local(v.ident.id)) {
            // put in symbol table
            this.symboltable.set(v.ident.id, val);
            return val;
        }
        throw new RuntimeError(`variable ${v.ident.toString()} already defined`, v.location)
    }

    visitFun(f: LoxFun): LoxValue {
        const val = new LoxFunction(f);
        this.symboltable.set(f.name.id, val);
        return val;
    }

    assignment(left: LoxExpr, right: LoxExpr): LoxValue {

        // check if left hand expression is a lvalue - assignable
        if (!(left instanceof LoxIdentifier)) {
            throw new RuntimeError(`can't assign to ${left.toString()}`, left.location)
        }
        let var_name = left.id;
        //console.log(`assign to ${var_name}.`)
        //this.symboltable.dump();
        let val = right.accept(this);
        if (this.symboltable.has(var_name)) {
            this.symboltable.assign(var_name, val)
            return val
        }
        throw new RuntimeError(`undefined variable ${left.toString()}`, left.location)
    }

    visitIf(expr: LoxIf): LoxValue {
        const val = expr.expr.accept(this);
        if (this.truthy(val)) {
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
        while (this.truthy(v)) {
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
            var val: LoxValue = true;
            if (e.cond) {
                val = e.cond.accept(this);
            }
            //console.log(`for cond = ${val}`)
            var ret: LoxValue = null;
            while (this.truthy(val)) {
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
            console.log("nil")
        } else {
            console.log(val.toString())
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

    visitUnary(e: LoxUnary): LoxValue {
        const val = e.expr.accept(this)
        switch (e.prefix) {
            case TokenType.MINUS:
                return - check_number(val, e.location)
            case TokenType.BANG:
                return !check_boolean(val, e.location)
        }
        if (val instanceof LoxCallable) {
            if (e.call) {
                var args = new Array<LoxValue>;
                for (var a of e.call.arguments) {
                    args.push(a.accept(this));
                }
                return (val as LoxCallable).call(this, args);
            }
        } else {
            throw new RuntimeError(`can't call ${e.expr}`, e.expr.location)
        }
        throw new Error("Method not implemented.");
    }


    visitCall(e: LoxCall): LoxValue {
        throw new Error("Method not implemented.");
    }

    visitBinary(e: LoxBinary): LoxValue {

        // check if it is assignment before evaluation
        if (e.operator == TokenType.EQUAL) {
            return this.assignment(e.left, e.right)
        }

        if (e.operator == TokenType.AND || e.operator == TokenType.OR) {
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
                    throw new RuntimeError(`can't apply ${e.operator} to ${left}`, e.left.location)
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

    private do_logical(e: LoxBinary) {
        const left = e.left.accept(this);
        if (e.operator == TokenType.OR) {
            if (this.truthy(left))
                return left
        } else {
            if (!this.truthy(left))
                return left
        }
        return e.right.accept(this);
    }

    visitIdentifier(e: LoxIdentifier): LoxValue {
        let val = this.symboltable.get(e.id)
        if (val == undefined) {
            throw new RuntimeError(`identifier ${e.id} not found`, e.location);
        }
        return val
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

    private truthy(v: LoxValue): boolean {
        if (v == null) {
            return false;
        }
        if (typeof v === "boolean") {
            return v
        }
        return true
    }
}