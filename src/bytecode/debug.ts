//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { Chunk } from "./chunk";
import { Opcode } from "./vm";

import _ from 'lodash';
import { CompiledFunction } from "./bytecode_runtime";

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
        case Opcode.AND:
            console.log(str + " AND");
            break;
        case Opcode.OR:
            console.log(str + " OR");
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
        case Opcode.POP:
            console.log(str + " POP");
            break;
        case Opcode.PRINT:
            console.log(str + " PRINT");
            break;
        case Opcode.POP_LOCAL:
            console.log(str + " POP_LOCAL");
            break;
        case Opcode.DEF_LOCAL:
            console.log(str + " DEF_LOCAL");
            break;
        case Opcode.INHERIT:
            console.log(str + " INHERIT");
            break;
        default:
            console.log(str + ` <unknown ${op}>`);
    }
    return offset + 1;
}

function val_name(offset: number, chunk: Chunk, name: string): string {
    let word = chunk.get_word(offset + 1)
    return ` ${name} - ${word}`;
}

function const_name(offset: number, chunk: Chunk, name: string): string {
    let word = chunk.get_word(offset + 1)
    let val = chunk.get_constant(word);
    return ` ${name} - ${word}\t'${val?.toString()}'`;
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
        case Opcode.DEF_GLOBAL: {
            console.log(str + const_name(offset, chunk, "DEF_GLOBAL"));
            break;
        }
        case Opcode.SET_GLOBAL: {
            console.log(str + const_name(offset, chunk, "SET_GLOBAL"));
            break;
        }
        case Opcode.GET_GLOBAL: {
            console.log(str + const_name(offset, chunk, "GET_GLOBAL"));
            break;
        }
        case Opcode.DEF_LOCAL: {
            console.log(str + val_name(offset, chunk, "DEF_LOCAL"));
            break;
        }
        case Opcode.GET_LOCAL: {
            console.log(str + val_name(offset, chunk, "GET_LOCAL"));
            break;
        }
        case Opcode.SET_LOCAL: {
            console.log(str + val_name(offset, chunk, "SET_LOCAL"));
            break;
        }
        case Opcode.GET_UPVALUE: {
            console.log(str + val_name(offset, chunk, "GET_UPVALUE"));
            break;
        }
        case Opcode.SET_UPVALUE: {
            console.log(str + val_name(offset, chunk, "SET_UPVALUE"));
            break;
        }
        case Opcode.JMP_IF_FALSE: {
            console.log(str + val_name(offset, chunk, "JMP_IF_FALSE"));
            break;
        }
        case Opcode.JMP_IF_TRUE: {
            console.log(str + val_name(offset, chunk, "JMP_IF_TRUE"));
            break;
        }
        case Opcode.JUMP: {
            console.log(str + val_name(offset, chunk, "JUMP"));
            break;
        }
        case Opcode.CALL: {
            let word = chunk.get_byte(offset + 1)
            console.log(str + ` CALL [${word}]`);
            break;
        }
        case Opcode.CLOSURE: {
            let word = chunk.get_word(offset + 1)
            let fn = chunk.get_constant(word) as CompiledFunction;
            console.log(str + ` CLOSURE\t${fn.toString()} [${fn.arity()}]`);
            let start = offset + 2;
            _.range(0, fn.arity()).forEach((i) => {
                let is_local = chunk.get_byte(start++)
                let index = chunk.get_byte(start++)
                console.log(`      |\t${is_local ? "local" : "upvalue"} ${index}`)

            })
            break;
        }
        case Opcode.CLASS: {
            console.log(str + const_name(offset, chunk, "CLASS"));
            break;
        }
        case Opcode.SET_PROPERTY: {
            console.log(str + const_name(offset, chunk, "SET_PROPERTY"));
            break;
        }
        case Opcode.GET_PROPERTY: {
            console.log(str + const_name(offset, chunk, "GET_PROPERTY"));
            break;
        }
        case Opcode.METHOD: {
            console.log(str + const_name(offset, chunk, "METHOD"));
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
        case Opcode.CONSTANT: case Opcode.LINE:
            return constant_instruction(instr as Opcode, offset, chunk);
        case Opcode.DEF_GLOBAL: case Opcode.GET_GLOBAL: case Opcode.SET_GLOBAL:
            return constant_instruction(instr as Opcode, offset, chunk);
        case Opcode.GET_LOCAL: case Opcode.SET_LOCAL: case Opcode.GET_UPVALUE: case Opcode.SET_UPVALUE:
        case Opcode.JMP_IF_FALSE: case Opcode.JMP_IF_TRUE: case Opcode.JUMP:
        case Opcode.CALL: case Opcode.CLOSURE: case Opcode.CLASS:
        case Opcode.SET_PROPERTY: case Opcode.GET_PROPERTY: case Opcode.METHOD:
            return constant_instruction(instr as Opcode, offset, chunk);
    }
    return simple_instruction(instr as Opcode, offset);
}
