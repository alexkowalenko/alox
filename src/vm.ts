//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { Chunk } from "./chunk";
import { RuntimeError } from "./error";
import { check_number, LoxValue, pretty_print, truthy } from "./runtime";
import { Location } from "./token";

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
    EQUAL,
    LESS,
    GREATER
}

export function simple_instruction(op: Opcode, offset: number): number {
    let str = String(offset).padStart(4, '0');
    switch (op) {
        case Opcode.RETURN:
            console.log(str + " RETURN");
            break;
        case Opcode.NEGATE:
            console.log(str + " NEGATE");
            break;
        case Opcode.ADD:
            console.log(str + " ADD");
            break;
        case Opcode.SUBTRACT:
            console.log(str + " SUBTRACT");
            break;
        case Opcode.MULTIPLY:
            console.log(str + " MULTIPLY");
            break;
        case Opcode.DIVIDE:
            console.log(str + " DIVIDE");
            break;
        case Opcode.NIL:
            console.log(str + " NIL");
            break;
        case Opcode.TRUE:
            console.log(str + " TRUE");
            break;
        case Opcode.FALSE:
            console.log(str + " FALSE");
            break;
        case Opcode.NOT:
            console.log(str + " NOT");
            break;
        case Opcode.EQUAL:
            console.log(str + " EQUAL");
            break;
        case Opcode.LESS:
            console.log(str + " LESS");
            break;
        case Opcode.GREATER:
            console.log(str + " GREATER");
            break;
        default:
            console.log(str + ` <unknown ${op}>`);
    }
    return offset + 1;
}

export function constant_instruction(op: Opcode, offset: number, chunk: Chunk): number {
    let str = String(offset).padStart(4, '0');
    switch (op) {
        case Opcode.CONSTANT: {
            let word = chunk.get_word(offset + 1)
            let val = chunk.get_constant(word);
            console.log(`${str} CONSTANT ${word}\t'${val?.toString()}'`);
            break;
        }
        case Opcode.LINE: {
            let word = chunk.get_word(offset + 1)
            console.log(`${str} LINE-- - ${word}`);
            break;
        }
        default:
            console.log(str + ` <unknown ${op}>`);
    }
    return offset + 3;
}

export class VM {
    constructor(private chunk: Chunk) {
        this.stack = new Array;
    }
    private stack: Array<LoxValue>;
    private ip = 0;
    private last_line = 0;

    public debug = true;

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
        return new Location(this.last_line, 0);
    }

    check_number(index: number = 0) {
        check_number(this.peek(index), this.get_location());
    }

    interpret() {
        for (; ;) {
            let instr = this.chunk.get_byte(this.ip);
            if (this.debug) {
                this.chunk.disassemble_instruction(this.ip);
            }
            this.ip++;
            switch (instr) {
                case Opcode.RETURN: {
                    let val = this.pop()
                    return val;
                }
                case Opcode.CONSTANT: {
                    let val = this.chunk.get_constant(this.chunk.get_word(this.ip))
                    this.ip += 2;
                    if (this.debug) {
                        console.log("constant: " + pretty_print(val))
                    }
                    this.push(val)
                    continue;
                }
                case Opcode.LINE: { //NOP
                    this.last_line = this.chunk.get_word(this.ip);
                    this.ip += 2;
                    continue;
                }
                case Opcode.NEGATE:
                    this.check_number();
                    this.push(- this.pop()!)
                    continue;

                case Opcode.NOT:
                    this.push(!truthy(this.pop()!));
                    continue;

                case Opcode.EQUAL:
                    this.push(this.pop() === this.pop());
                    continue;

                case Opcode.LESS:
                    this.check_number();
                    this.check_number(1);
                    this.push((this.pop() as number) < (this.pop() as number));
                    continue;
                case Opcode.GREATER:
                    this.check_number();
                    this.check_number(1);
                    this.push((this.pop() as number) > (this.pop() as number));
                    continue;

                case Opcode.ADD:
                    this.check_number();
                    this.check_number(1);
                    this.push((this.pop() as number) + (this.pop() as number));
                    continue;
                case Opcode.SUBTRACT:
                    this.check_number();
                    this.check_number(1);
                    this.push((this.pop() as number) - (this.pop() as number));
                    continue;
                case Opcode.MULTIPLY:
                    this.check_number();
                    this.check_number(1);
                    this.push((this.pop() as number) * (this.pop() as number));
                    continue;
                case Opcode.DIVIDE:
                    this.check_number();
                    this.check_number(1);
                    this.push((this.pop() as number) / (this.pop() as number));
                    continue;

                case Opcode.NIL:
                    this.push(null);
                    continue;
                case Opcode.TRUE:
                    this.push(true);
                    continue;
                case Opcode.FALSE:
                    this.push(false);
                    continue;

                default:
                    throw new RuntimeError("implementation: unknown instruction " + instr, this.get_location())
            }
        }
    }
}



