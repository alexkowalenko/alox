//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { AstVisitor, LoxExpr, LoxNumber, LoxBool, LoxNil, LoxUnary, LoxBinary, LoxString, LoxProgram, LoxPrint, LoxIdentifier, LoxVar, LoxBlock, LoxIf } from "./ast";
import { RuntimeError } from "./error";
import { SymbolTable } from "./symboltable";
import { Location, TokenType } from "./token";

export type LoxValue = number | string | boolean | null

export class Evaluator extends AstVisitor<LoxValue> {


    constructor(private symboltable: SymbolTable<LoxValue>) {
        super()
    }

    eval(expr: LoxExpr): LoxValue {
        return expr.accept(this)
    }


    private check_number(v: LoxValue, where: Location): number {
        if (typeof v != "number") {
            throw new RuntimeError("value must be a number", where)
        }
        return v
    }

    private check_string(v: LoxValue, where: Location): string {
        if (typeof v != "string") {
            throw new RuntimeError("value must be a string", where)
        }
        return v
    }

    private check_boolean(v: LoxValue, where: Location): boolean {
        if (typeof v != "boolean") {
            throw new RuntimeError("value must be a boolean", where)
        }
        return v
    }

    /**
     * 
     * @param prog program to execute
     * @returns 
     */
    visitProgram(prog: LoxProgram): LoxValue {
        let val = null
        for (const stat of prog.statements) {
            val = stat.accept(this)
        }
        return val
    }

    visitVar(v: LoxVar): LoxValue {
        var val = v.expr.accept(this)
        if (!this.symboltable.has(v.ident.id)) {
            // put in symbol table
            this.symboltable.set(v.ident.id, val);
            return val;
        }
        throw new RuntimeError(`variable ${v.ident.toString()} already defined`, v.location)
    }

    assignment(left: LoxExpr, right: LoxExpr): LoxValue {

        // check if left hand expression is a lvalue - assignable
        if (!(left instanceof LoxIdentifier)) {
            throw new RuntimeError(`can't assign to ${left.toString()}`, left.location)
        }
        let var_name = left.id;
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

    visitPrint(p: LoxPrint): LoxValue {
        let val = p.expr.accept(this)
        if (val === null) {
            console.log("nil")
        } else {
            console.log(val)
        }
        return val
    }

    visitBlock(expr: LoxBlock): LoxValue {
        let prev = this.symboltable;
        this.symboltable = new SymbolTable(prev);
        let result: LoxValue = null;
        for (const stat of expr.statements) {
            result = stat.accept(this)
        }
        this.symboltable = prev;
        return result;
    }

    visitUnary(e: LoxUnary): LoxValue {
        const val = e.expr.accept(this)
        switch (e.prefix) {
            case TokenType.MINUS:
                return - this.check_number(val, e.location)
            case TokenType.BANG:
                return !this.check_boolean(val, e.location)
        }
        throw new RuntimeError(`unhandled unary operator ${e.prefix}`, e.location)
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
                    return left + this.check_number(right, e.right.location)
                else if (typeof left === "string")
                    return this.check_string(left, e.left.location) + this.check_string(right, e.right.location)
                else {
                    throw new RuntimeError(`can't apply ${e.operator} to ${left}`, e.left.location)
                }

            case TokenType.MINUS:
                return this.check_number(left, e.left.location) - this.check_number(right, e.right.location)

            case TokenType.ASTÉRIX:
                return this.check_number(left, e.left.location) * this.check_number(right, e.right.location)

            case TokenType.SLASH:
                return this.check_number(left, e.left.location) / this.check_number(right, e.right.location)

            // Relational
            case TokenType.LESS:
                return this.check_number(left, e.left.location) < this.check_number(right, e.right.location)
            case TokenType.LESS_EQUAL:
                return this.check_number(left, e.left.location) <= this.check_number(right, e.right.location)
            case TokenType.GREATER:
                return this.check_number(left, e.left.location) > this.check_number(right, e.right.location)
            case TokenType.GREATER_EQUAL:
                return this.check_number(left, e.left.location) >= this.check_number(right, e.right.location)
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