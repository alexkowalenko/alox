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
    NEGATE,
    ADD,
    SUBTRACT,
    MULTIPLY,
    DIVIDE,
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
                    this.push(- this.pop()!)
                    continue;

                case Opcode.ADD:
                    this.push((this.pop() as number) + (this.pop() as number));
                    continue;
                case Opcode.SUBTRACT:
                    this.push((this.pop() as number) - (this.pop() as number));
                    continue;
                case Opcode.MULTIPLY:
                    this.push((this.pop() as number) * (this.pop() as number));
                    continue;
                case Opcode.DIVIDE:
                    this.push((this.pop() as number) / (this.pop() as number));
                    continue;

                default:
                    throw new RuntimeError("implementation: unknown instruction " + instr, new Location(this.last_line, 0))
            }
        }
    }
}



