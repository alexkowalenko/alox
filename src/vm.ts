//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { Chunk } from "./chunk";
import { RuntimeError } from "./error";
import { check_number, LoxValue, pretty_print } from "./runtime";
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
    FALSE
}

export function simple_instruction(op: Opcode, offset: number): number {
    let str = String(offset).padStart(4, '0');
    switch (op) {
        case Opcode.RETURN:
            console.log(str + " RETURN");
            return offset + 1;
        case Opcode.NEGATE:
            console.log(str + " NEGATE");
            return offset + 1;
        case Opcode.ADD:
            console.log(str + " ADD");
            return offset + 1;
        case Opcode.SUBTRACT:
            console.log(str + " SUBTRACT");
            return offset + 1;
        case Opcode.MULTIPLY:
            console.log(str + " MULTIPLY");
            return offset + 1;
        case Opcode.DIVIDE:
            console.log(str + " DIVIDE");
            return offset + 1;
        case Opcode.NIL:
            console.log(str + " NIL");
            return offset + 1;
        case Opcode.TRUE:
            console.log(str + " TRUE");
            return offset + 1;
        case Opcode.FALSE:
            console.log(str + " FALSE");
            return offset + 1;
    }
    return offset;
}

export function constant_instruction(op: Opcode, offset: number, chunk: Chunk): number {
    let str = String(offset).padStart(4, '0');
    switch (op) {
        case Opcode.CONSTANT: {
            let word = chunk.get_word(offset + 1)
            let val = chunk.get_constant(word);
            console.log(`${str} CONSTANT ${word}\t'${val?.toString()}'`);
            return offset + 3;
        }
        case Opcode.LINE: {
            let word = chunk.get_word(offset + 1)
            console.log(`${str} LINE --- ${word}`);
            return offset + 3;
        }
    }
    return offset;
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



