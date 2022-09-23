//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { Chunk } from "./chunk";
import { Opcode } from "./vm";

function simple_instruction(op: Opcode, offset: number): number {
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

function constant_instruction(op: Opcode, offset: number, chunk: Chunk): number {
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

export function disassemble_instruction(offset: number, chunk: Chunk) {
    let instr = chunk.get_byte(offset);
    switch (instr) {
        case Opcode.RETURN:
            return simple_instruction(instr as Opcode, offset);
        case Opcode.CONSTANT:
            return constant_instruction(instr as Opcode, offset, chunk);
        case Opcode.LINE:
            return constant_instruction(instr as Opcode, offset, chunk);
        case Opcode.NEGATE, Opcode.ADD, Opcode.SUBTRACT, Opcode.MULTIPLY, Opcode.DIVIDE, Opcode.NIL,
            Opcode.TRUE, Opcode.FALSE, Opcode.NOT, Opcode.EQUAL, Opcode.LESS, Opcode.GREATER:
            return simple_instruction(instr as Opcode, offset);
    }
    return simple_instruction(instr as Opcode, offset);
}
