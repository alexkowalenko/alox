//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { Evaluator, LoxValue } from "./evaluator";
import { Lexer } from "./lexer";
import { Parser } from "./parser";
import { Printer } from "./printer";

export class Interpreter {
    constructor() {
        this.lexer = new Lexer();
        this.parser = new Parser(this.lexer);
        this.evaluator = new Evaluator()
    };
    private lexer: Lexer;
    private parser: Parser;
    private evaluator: Evaluator;

    do(line: string): LoxValue {
        const expr = this.parser.parse(line)
        const printer: Printer = new Printer(true);
        console.log(printer.print(expr))
        const val = this.evaluator.eval(expr)
        return val;
    }

    pretty_print(v: LoxValue): string {
        if (v === null) {
            return 'nil'
        }
        if (typeof v == 'string') {
            return '"' + v + '"'
        }
        return v.toString();
    }
}