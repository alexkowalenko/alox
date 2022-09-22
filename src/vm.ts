//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { Chunk } from "./chunk";
import { RuntimeError } from "./error";
import { LoxValue, pretty_print } from "./runtime";
import { Location } from "./token";

export const enum Opcode {
    CONSTANT,
    RETURN,
    LINE, // Debug instruction, No-op
}

export function simple_instruction(op: Opcode, offset: number): number {
    let str = String(offset).padStart(4, '0');
    switch (op) {
        case Opcode.RETURN:
            console.log(str + " RETURN");
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

    reset_stack() {
        this.stack.length = 0;
    }

    pop() {
        return this.stack.pop()
    }

    push(val: LoxValue) {
        this.stack.push(val)
    }

    interpret() {
        let last_line = 0;
        for (; ;) {
            let instr = this.chunk.get_byte(this.ip);
            this.chunk.disasamble_instruction(this.ip);
            this.ip++;
            switch (instr) {
                case Opcode.RETURN: {
                    let val = this.pop()
                    return val;
                }
                case Opcode.CONSTANT: {
                    let val = this.chunk.get_constant(this.chunk.get_word(this.ip))
                    this.ip += 2;
                    console.log("constant: " + pretty_print(val))
                    this.push(val)
                    continue;
                }
                case Opcode.LINE: { //NOP
                    last_line = this.chunk.get_word(this.ip);
                    this.ip += 2;
                    continue;
                }
                default:
                    throw new RuntimeError("implementation: unknown instruction " + instr, new Location(last_line, 0))
            }
        }
    }
}



