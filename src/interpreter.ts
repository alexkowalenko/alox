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
import { LoxError } from "./error";

import * as stream from "node:stream";
import os from "os";
import { finished } from 'node:stream/promises';


export class Options {
    constructor() { };
    public silent = false;
    public parse = false;
    public timer = false;

    public output = process.stdout;
    public input: stream.Readable = process.stdin;
    public error = process.stderr;
}

export class Interpreter {
    constructor(private readonly options: Options) {
        this.lexer = new Lexer;
        this.parser = new Parser(this.lexer);
        this.symboltable = new SymbolTable<LoxValue>;
        this.evaluator = new Evaluator(this.symboltable, options);
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

        this.symboltable.set("exit", new class extends LoxCallable {
            call(i: Evaluator, args: LoxValue[]): LoxValue {
                process.exit(args[0] as number)
            }
            arity(): number {
                return 1;
            }
        })
        this.analyser.define("exit")
    }

    do(line: string): LoxValue {
        if (this.options.timer) {
            console.time('time');
        }
        const expr = this.parser.parse(line)
        if (this.options.parse) {
            const printer: Printer = new Printer("\n", 4);
            console.log(printer.print(expr))
        }
        this.analyser.analyse(expr);
        const val = this.evaluator.eval(expr)
        if (this.options.timer) {
            console.timeEnd('time');
        }
        return val;
    }

    async do_stream(): Promise<LoxValue> {
        let input = this.options.input
        let ret: LoxValue = null;
        input.on('data', (data: string) => {
            try {
                ret = this.do(data);
            }
            catch (e) {
                if (e instanceof LoxError) {
                    if (!this.options.silent) {
                        this.options.error.write(e.toString() + os.EOL)
                    }
                } else {
                    throw e
                }
                return
            }
        })
        input.on('error', (err: Error) => {
            console.error(`problem reading ${err}`);
            throw err;
        })
        await finished(input);
        return ret;
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