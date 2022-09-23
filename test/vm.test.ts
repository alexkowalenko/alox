//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { Chunk } from "../src/chunk";
import { Options } from "../src/interpreter";
import { LoxValue } from "../src/runtime";
import { SymbolTable } from "../src/symboltable";
import { Opcode, VM } from "../src/vm";

describe('vm', () => {
    let st = new SymbolTable<LoxValue>();
    let opts = new Options;

    it('basic', () => {
        let chunk = new Chunk;
        chunk.write_line(123);
        let constant = chunk.add_constant(1.2);
        chunk.write_byte(Opcode.CONSTANT);
        chunk.write_word(constant);
        chunk.write_byte(Opcode.RETURN);

        let st = new SymbolTable<LoxValue>();
        let vm = new VM(chunk, st, opts);
        vm.debug = false;
        let val = vm.interpret();
        expect(val).toBe(1.2)
    })

    it('negate', () => {
        let chunk = new Chunk;
        let constant = chunk.add_constant(1);
        chunk.write_byte(Opcode.CONSTANT);
        chunk.write_word(constant);
        chunk.write_byte(Opcode.NEGATE);
        chunk.write_byte(Opcode.RETURN);

        let vm = new VM(chunk, st, opts);
        vm.debug = false;
        let val = vm.interpret();
        expect(val).toBe(-1)
    })

    it('arithmetic', () => {
        let chunk = new Chunk;
        let one = chunk.add_constant(1);
        chunk.write_byte(Opcode.CONSTANT);
        chunk.write_word(one);
        let two = chunk.add_constant(2);
        chunk.write_byte(Opcode.CONSTANT);
        chunk.write_word(two);
        chunk.write_byte(Opcode.ADD); // 3
        let four = chunk.add_constant(4);
        chunk.write_byte(Opcode.CONSTANT);
        chunk.write_word(four);
        chunk.write_byte(Opcode.MULTIPLY); // 12
        let threesix = chunk.add_constant(36);
        chunk.write_byte(Opcode.CONSTANT);
        chunk.write_word(threesix);
        chunk.write_byte(Opcode.DIVIDE); // 36 / 12 == 3
        let three = chunk.add_constant(3);
        chunk.write_byte(Opcode.CONSTANT);
        chunk.write_word(three);
        chunk.write_byte(Opcode.SUBTRACT); // 3 - 3 = 0
        chunk.write_byte(Opcode.RETURN);

        let vm = new VM(chunk, st, opts);
        vm.debug = false;
        let val = vm.interpret();
        expect(val).toBe(0)
    })
})