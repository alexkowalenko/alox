//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { Analyser } from "./analyser";
import { Evaluator } from "./evaluator";
import { Lexer } from "./lexer";
import { Parser } from "./parser";
import { Printer } from "./printer";
import { LoxCallable, LoxValue } from "./runtime";
import { SymbolTable } from "./symboltable";

export class Options {
    constructor() { };
    public silent = false;
    public parseOnly = false;
    public timer = false;
}

export class Interpreter {
    constructor(private readonly options: Options) {
        this.lexer = new Lexer;
        this.parser = new Parser(this.lexer);
        this.symboltable = new SymbolTable<LoxValue>;
        this.evaluator = new Evaluator(this.symboltable);
        this.analyser = new Analyser(this.evaluator);
        this.setup_stdlib();
    };
    private lexer: Lexer;
    private parser: Parser;
    private analyser: Analyser;
    private evaluator: Evaluator;
    private symboltable: SymbolTable<LoxValue>;

    private setup_stdlib() {
        this.symboltable.set("clock", new class extends LoxCallable {
            call(i: Evaluator, args: LoxValue[]): LoxValue {
                return Date.now();
            }
            arity(): number {
                return 0;
            }
        })
        this.analyser.define("clock")
    }

    do(line: string): LoxValue {
        if (this.options.timer) {
            console.time('time');
        }
        const expr = this.parser.parse(line)
        const printer: Printer = new Printer("\n", 4);
        if (!this.options.silent) {
            console.log(printer.print(expr))
        }
        if (this.options.parseOnly) {
            return null;
        }
        this.analyser.analyse(expr);
        const val = this.evaluator.eval(expr)
        if (this.options.timer) {
            console.timeEnd('time');
        }
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