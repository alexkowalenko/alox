//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { AstVisitor, LoxAssign, LoxBinary, LoxBlock, LoxBool, LoxBreak, LoxCall, LoxClassDef, LoxExpr, LoxFor, LoxFun, LoxGet, LoxGroup, LoxIdentifier, LoxIf, LoxLiteral, LoxNil, LoxNumber, LoxPrint, LoxProgram, LoxReturn, LoxSet, LoxString, LoxThis, LoxUnary, LoxVar, LoxWhile } from "./ast";

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
        let buf = "var " + e.ident.accept(this);
        if (e.expr) {
            buf += " = " + e.expr.accept(this)
        }
        return buf;
    }

    visitFun(f: LoxFun): string {
        let buf = f.method ? '' : 'fun ';
        if (f.name !== undefined) {
            buf += f.name.id;
        }
        buf += '('
        for (let i = 0; i < f.args.length; i++) {
            buf += f.args[i].accept(this)
            if (i < f.args.length - 1) {
                buf += ", "
            }
        }
        buf += ")" + this.newline;
        buf += f.body!.accept(this);
        return buf;
    }

    visitClass(c: LoxClassDef): string {
        let buf = `class ${c.name} `;
        if (c.super_class) {
            buf += `< ${c.super_class} `
        }
        buf += '{' + this.newline;
        for (const m of c.methods) {
            buf += m.accept(this) + ' ' + this.newline;
        }
        return buf + '}'
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
        let buf = "for ( ";
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

    visitBreak(expr: LoxBreak): string {
        return expr.what;
    }

    visitReturn(e: LoxReturn): string {
        let buf = "return";
        if (e.expr) {
            buf += " " + e.expr.accept(this);
        }
        return buf;
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
        let buf = '';
        if (e.prefix) {
            buf += e.prefix;
        }
        buf += e.expr.accept(this)
        return buf
    }

    visitCall(e: LoxCall): string {
        let buf = e.expr.accept(this)
        buf += '(';
        for (let i = 0; i < e.arguments.length; i++) {
            buf += e.arguments[i].accept(this)
            if (i < e.arguments.length - 1) {
                buf += ", "
            }
        }
        return buf + ")";
    }

    visitGet(e: LoxGet): string {
        return this.visitExpr(e.expr) + '.' + e.ident.id;
    }

    visitSet(e: LoxSet): string {
        return `${this.visitExpr(e.expr)}.${e.ident.id} = ${e.value}`;
    }

    visitBinary(e: LoxBinary): string {
        return `(${e.left.accept(this)} ${e.operator} ${e.right.accept(this)})`
    }

    visitAssign(e: LoxAssign): string {
        return `(${e.left.accept(this)} = ${e.right.accept(this)})`
    }

    visitGroup(e: LoxGroup): string {
        return "( " + e.expr.accept(this) + " )"
    }

    visitIdentifier(e: LoxIdentifier): string {
        return e.id
    }

    visitThis(e: LoxThis): string {
        return "this"
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