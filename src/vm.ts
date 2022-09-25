//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { Chunk } from "./chunk";
import { disassemble_instruction } from "./debug";
import { RuntimeError } from "./error";
import { Options } from "./interpreter";
import { check_number, check_string, LoxValue, pretty_print, truthy } from "./runtime";
import { Location } from "./token";

import os from "os";
import { SymbolTable } from "./symboltable";
import { CompiledFunction } from "./compiler";

export const enum Opcode {
    CONSTANT,
    RETURN,
    LINE, // Debug instruction, No-op
    NEGATE,
    ADD,
    SUBTRACT,
    MULTIPLY,
    DIVIDE,
    NIL,
    TRUE,
    FALSE,
    NOT,
    AND,
    OR,
    EQUAL,
    LESS,
    GREATER,
    POP,
    PRINT,
    DEF_GLOBAL,
    GET_GLOBAL,
    SET_GLOBAL,
    DEF_LOCAL,
    GET_LOCAL,
    SET_LOCAL,
    POP_LOCAL,
    JMP_IF_FALSE,
    JMP_IF_TRUE,
    JUMP,
    CALL,
}

class Frame {
    constructor(public previous_stack_ptr: number,
        public previous_locals_ptr: number,
        public chunk: Chunk,
        public ip: number = 0,
        public last_line: number = 0) { };

    fn?: CompiledFunction;
}

export class VM {
    constructor(chunk: Chunk, private symboltable: SymbolTable<LoxValue>, private options: Options) {
        this.stack = new Array;
        this.locals_stack = new Array;
        this.frame_stack = new Array;
        this.frame_stack.push(new Frame(0, 0, chunk));
    }
    private stack: Array<LoxValue>;
    private locals_stack: Array<LoxValue>;
    private frame_stack: Array<Frame>;

    public debug = true;

    current(): Frame {
        return this.frame_stack.at(-1)!
    }

    reset_stack() {
        this.stack.length = 0;
    }

    pop() {
        return this.stack.pop()
    }

    push(val: LoxValue) {
        this.stack.push(val)
    }

    peek(index: number = 0): LoxValue {
        return this.stack.at(-1 - index)!
    }

    get_location(): Location {
        return new Location(this.current().last_line, 0);
    }

    check_number(index: number = 0) {
        check_number(this.peek(index), this.get_location());
    }

    check_string(index: number = 0) {
        check_string(this.peek(index), this.get_location());
    }

    get_word_arg() {
        let val = this.current().chunk.get_constant(this.current().chunk.get_word(this.current().ip))
        this.current().ip += 2;
        return val;
    }

    get_word() {
        let val = this.current().chunk.get_word(this.current().ip);
        this.current().ip += 2;
        return val;
    }

    interpret() {
        if (this.debug) {
            console.log("START:")
        }
        for (; ;) {
            let instr = this.current().chunk.get_byte(this.current().ip);
            if (this.debug) {
                disassemble_instruction(this.current().ip, this.current().chunk);
            }
            this.current().ip++;
            if (this.current().ip >= this.current().chunk.end) {
                return this.pop() ?? null;
            }
            switch (instr) {
                case Opcode.RETURN: {
                    if (this.frame_stack.length > 1) {
                        let val = this.stack.pop()!; // save final value before removing the frame.
                        let last_frame = this.frame_stack.pop()!
                        this.stack.length = last_frame.previous_stack_ptr
                        this.locals_stack.length = last_frame.previous_locals_ptr
                        // push on the return val;
                        this.stack.push(val);
                        break;
                    }
                    let val = this.pop()
                    return val;
                }
                case Opcode.POP: {
                    this.pop();
                    break;
                }
                case Opcode.CONSTANT: {
                    let val = this.get_word_arg()
                    if (this.debug) {
                        console.log("constant: " + pretty_print(val))
                    }
                    this.push(val)
                    break;
                }
                case Opcode.LINE: { //NOP
                    this.current().last_line = this.get_word();
                    continue;
                }
                case Opcode.NEGATE:
                    this.check_number();
                    this.push(- this.pop()!)
                    break;

                case Opcode.NOT:
                    this.push(!truthy(this.pop()!));
                    break;

                case Opcode.AND: {
                    let right = this.pop();
                    let left = this.pop();
                    if (!truthy(left!)) {
                        this.push(left!)
                    } else {
                        this.push(right!)
                    }
                    break;
                }

                case Opcode.OR: {
                    let right = this.pop();
                    let left = this.pop();
                    if (truthy(left!)) {
                        this.push(left!)
                    } else {
                        this.push(right!)
                    }
                    break;
                }

                case Opcode.EQUAL:
                    this.push(this.pop() === this.pop());
                    break;

                case Opcode.LESS:
                    this.check_number();
                    this.check_number(1);
                    this.push((this.pop() as number) < (this.pop() as number));
                    break;
                case Opcode.GREATER:
                    this.check_number();
                    this.check_number(1);
                    this.push((this.pop() as number) > (this.pop() as number));
                    break;

                case Opcode.ADD: {
                    if (typeof this.peek() === "number") {
                        this.check_number();
                        this.check_number(1);
                        this.push((this.pop() as number) + (this.pop() as number));
                        break;
                    } else if (typeof this.peek() === "string") {
                        this.check_string();
                        this.check_string(1);
                        this.push((this.pop() as string) + (this.pop() as string));
                        break;
                    } else {
                        throw new RuntimeError(`can't apply + to ${pretty_print(this.peek())}`, this.get_location())
                    }
                }
                case Opcode.SUBTRACT:
                    this.check_number();
                    this.check_number(1);
                    this.push((this.pop() as number) - (this.pop() as number));
                    break;
                case Opcode.MULTIPLY:
                    this.check_number();
                    this.check_number(1);
                    this.push((this.pop() as number) * (this.pop() as number));
                    break;
                case Opcode.DIVIDE:
                    this.check_number();
                    this.check_number(1);
                    this.push((this.pop() as number) / (this.pop() as number));
                    break;

                case Opcode.NIL:
                    this.push(null);
                    break;
                case Opcode.TRUE:
                    this.push(true);
                    break;
                case Opcode.FALSE:
                    this.push(false);
                    break;

                case Opcode.PRINT: {
                    let val = this.peek();
                    if (val === null) {
                        this.options.output.write("nil" + os.EOL)
                    } else {
                        this.options.output.write(val!.toString() + os.EOL)
                    }
                    break;
                }

                case Opcode.DEF_GLOBAL: {
                    let id = this.get_word_arg()
                    let expr = this.peek();
                    this.symboltable.set(id as string, expr!)
                    break;
                }

                case Opcode.SET_GLOBAL: {
                    let id = this.get_word_arg()
                    let expr = this.peek();
                    if (this.symboltable.has(id as string)) {
                        this.symboltable.assign(id as string, expr!)
                        break;
                    }
                    throw new RuntimeError(`undefined variable ${id!.toString()}`, this.get_location())
                }

                case Opcode.GET_GLOBAL: {
                    let id = this.get_word_arg()
                    let val = this.symboltable.get(id as string);
                    if (val == undefined) {
                        throw new RuntimeError(`identifier ${id!.toString()} not found`, this.get_location());
                    }
                    this.push(val)
                    break;
                }

                case Opcode.DEF_LOCAL: {
                    let expr = this.peek();
                    this.locals_stack.push(expr)
                    break;
                }

                case Opcode.SET_LOCAL: {
                    let id = this.get_word()
                    let expr = this.peek();
                    this.locals_stack[id] = expr;
                    break;
                }

                case Opcode.GET_LOCAL: {
                    let id = this.get_word();
                    this.push(this.locals_stack[id])
                    break;
                }

                case Opcode.POP_LOCAL:
                    this.locals_stack.pop();
                    break;

                case Opcode.JMP_IF_FALSE: {
                    let offset = this.get_word();
                    let val = this.peek();
                    if (!truthy(val!)) {
                        this.current().ip += offset;
                    }
                    break;
                }

                case Opcode.JMP_IF_TRUE: {
                    let offset = this.get_word();
                    let val = this.peek();
                    if (truthy(val!)) {
                        this.current().ip += offset;
                    }
                    break;
                }

                case Opcode.JUMP: {
                    let offset = this.get_word();
                    this.current().ip += offset;
                    break;
                }

                case Opcode.CALL: {
                    let id = this.get_word_arg()
                    let val = this.symboltable.get(id as string);
                    var fun = val as CompiledFunction;
                    var new_frame = new Frame(this.stack.length, this.locals_stack.length, fun.bytecodes);
                    new_frame.fn = fun;
                    this.frame_stack.push(new_frame);
                    // execute function
                    break;
                }

                default:
                    throw new RuntimeError("implementation: unknown instruction " + instr, this.get_location())
            }
            if (this.debug) {
                this.dump_stack();
            }
        }
    }

    dump_symboltable() {
        this.symboltable.dump();
    }

    dump_stack() {
        let buf = "";
        this.stack.forEach((v) => {
            buf += ` ${pretty_print(v)} | `
        })
        console.log("stack:" + buf);
        buf = "";
        this.locals_stack.forEach((v) => {
            buf += ` ${pretty_print(v)} | `
        })
        console.log("local:" + buf);
    }

    dump_frame() {
        console.log("Frames:")
        for (let frame of this.frame_stack) {
            console.log(`    line ${frame.last_line} in ${frame.fn ?? '_main'}`)
        }
    }
}



