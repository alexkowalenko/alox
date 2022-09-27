//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { Analyser } from "./analyser";
import { TreeEvaluator } from "./tree/evaluator";
import { Compiler } from "./bytecode/compiler";
import { Lexer } from "./lexer";
import { Parser } from "./parser";
import { Printer } from "./printer";
import { LoxCallable, LoxValue, Function_Evaluator, Evaluator } from "./runtime";
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

    public output: stream.Writable = process.stdout;
    public input: stream.Readable = process.stdin;
    public error: stream.Writable = process.stderr;

    public bytecode = false;
    public debug = false;
    public trace = false;
}

abstract class StdlibClass extends LoxCallable {
    constructor(readonly options: Options) { super() };
    abstract arity(): number;
}

export class Interpreter {
    constructor(private readonly options: Options) {
        this.lexer = new Lexer;
        this.parser = new Parser(this.lexer);
        this.symboltable = new SymbolTable<LoxValue>;
        if (options.bytecode) {
            this.evaluator = new Compiler(this.symboltable, options);
        } else {
            this.evaluator = new TreeEvaluator(this.symboltable, options);
        }
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
            call(_: Function_Evaluator, args: LoxValue[]): LoxValue {
                return Date.now();
            }
            arity(): number {
                return 0;
            }
        })
        this.analyser.define("clock")

        this.symboltable.set("exit", new class extends LoxCallable {
            call(_: Function_Evaluator, args: LoxValue[]): LoxValue {
                process.exit(args[0] as number)
            }
            arity(): number {
                return 1;
            }
        })
        this.analyser.define("exit")

        this.symboltable.set("print_error", new class extends StdlibClass {
            call(_: Function_Evaluator, args: LoxValue[]): LoxValue {
                this.options.error.write(args[0] + os.EOL)
                return args[0];
            }
            arity(): number {
                return 1;
            }
        }(this.options))
        this.analyser.define("print_error")
    }

    do(line: string): LoxValue {
        if (this.options.timer) {
            console.time('time');
        }
        const expr = this.parser.parse(line)
        if (this.options.parse) {
            const printer: Printer = new Printer("\n", 4);
            this.options.output.write(printer.print(expr) + os.EOL)
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
}