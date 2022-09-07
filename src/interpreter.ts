//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { Evaluator, LoxValue } from "./evaluator";
import { Lexer } from "./lexer";
import { Parser } from "./parser";
import { Printer } from "./printer";
import { SymbolTable } from "./symboltable";

export class Options {
    constructor() { };
    public silent = false;
}

export class Interpreter {
    constructor(private readonly options: Options) {
        this.lexer = new Lexer();
        this.parser = new Parser(this.lexer);
        this.symboltable = new SymbolTable<LoxValue>;
        this.evaluator = new Evaluator(this.symboltable)
    };
    private lexer: Lexer;
    private parser: Parser;
    private evaluator: Evaluator;
    private symboltable: SymbolTable<LoxValue>;

    do(line: string): LoxValue {
        const expr = this.parser.parse(line)
        const printer: Printer = new Printer(true);
        if (!this.options.silent) {
            console.log(printer.print(expr))
        }
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