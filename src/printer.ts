//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { AstVisitor, LoxBinary, LoxBlock, LoxBool, LoxExpr, LoxFor, LoxGroup, LoxIdentifier, LoxIf, LoxLiteral, LoxNil, LoxNumber, LoxPrint, LoxProgram, LoxString, LoxUnary, LoxVar, LoxWhile } from "./ast";

import { Writable } from 'stream'

export class Printer extends AstVisitor<string> {

    constructor(private newline = "", private indent = 0) { super() }

    public print(expr: LoxExpr): string {
        return expr.accept(this)
    }

    visitProgram(prog: LoxProgram): string {
        let buf = ""
        for (let stat of prog.statements) {
            buf += stat.accept(this);
            if (!(stat instanceof LoxBlock)) {
                buf += ";"
            }
            buf += this.newline
        }
        if (this.newline.length > 0) {
            buf = buf.trimEnd();
        }
        return buf
    }

    visitVar(e: LoxVar): string {
        var buf = "var " + e.ident.accept(this);
        if (e.expr) {
            buf += " = " + e.expr.accept(this)
        }
        return buf;
    }

    visitIf(expr: LoxIf): string {
        let buf = "if (" + expr.expr.accept(this) + ") " + this.newline + expr.then.accept(this);
        if (expr.else) {
            buf += this.newline + " else " + expr.else.accept(this);
        }
        return buf;
    }

    visitWhile(expr: LoxWhile): string {
        return "while (" + expr.expr.accept(this) + ") " + this.newline + expr.stats.accept(this);
    }

    visitFor(e: LoxFor): string {
        var buf = "for ( ";
        if (e.init) {
            buf += e.init.accept(this)
        }
        buf += "; ";
        if (e.cond) {
            buf += e.cond.accept(this)
        }
        buf += "; "
        if (e.iter) {
            buf += e.iter.accept(this)
        }
        buf += ") " + this.newline + e.stat!.accept(this);
        return buf;
    }

    visitPrint(e: LoxPrint): string {
        return "print " + e.expr.accept(this);
    }

    visitBlock(expr: LoxBlock): string {
        let buf = '{' + this.newline
        for (const stat of expr.statements) {
            buf += " ".repeat(this.indent) + stat.accept(this)
            if (!(stat instanceof LoxBlock)) {
                buf += ";"
            }
            buf += this.newline
        }
        buf += '}'
        return buf
    }

    visitUnary(e: LoxUnary): string {
        return e.prefix + e.expr.accept(this)
    }

    visitBinary(e: LoxBinary): string {
        return `(${e.left.accept(this)} ${e.operator} ${e.right.accept(this)})`
    }

    visitGroup(e: LoxGroup): string {
        return "( " + e.expr.accept(this) + " )"
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