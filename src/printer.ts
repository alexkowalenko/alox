//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { AstVisitor, LoxBinary, LoxBool, LoxExpr, LoxGroup, LoxIdentifier, LoxLiteral, LoxNil, LoxNumber, LoxPrint, LoxProgram, LoxString, LoxUnary, LoxVar } from "./ast";

import { Writable } from 'stream'

export class Printer extends AstVisitor<string> {

    constructor(private newlines = false) { super() }

    public print(expr: LoxExpr): string {
        return expr.accept(this)
    }

    visitProgram(prog: LoxProgram): string {
        let buf = ""
        for (let stat of prog.statements) {
            buf += stat.accept(this) + ";"
            if (this.newlines) {
                buf += "\n"
            }
        }
        if (this.newlines) {
            buf = buf.trimEnd();
        }
        return buf
    }

    visitVar(expr: LoxVar): string {
        return "var " + expr.ident.accept(this) + " = " + expr.expr.accept(this)
    }

    visitPrint(expr: LoxPrint): string {
        return expr.toString();
    }

    visitUnary(e: LoxUnary): string {
        return e.toString()
    }

    visitBinary(e: LoxBinary): string {
        return e.toString();
    }

    visitGroup(e: LoxGroup): string {
        return e.toString()
    }

    visitIdentifier(e: LoxIdentifier): string {
        return e.id
    }

    visitNumber(expr: LoxNumber): string {
        return "" + expr.value
    }

    visitString(expr: LoxString): string {
        return expr.toString()
    }

    visitBool(expr: LoxBool): string {
        return expr.toString()
    }

    visitNil(expr: LoxNil): string {
        return "nil"
    }
}