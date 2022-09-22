//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { Chunk } from "../src/chunk";
import { Opcode, VM } from "../src/vm";

describe('vm', () => {
    it('basic', () => {
        let chunk = new Chunk;
        chunk.write_line(123);
        let constant = chunk.add_constant(1.2);
        chunk.write_byte(Opcode.CONSTANT);
        chunk.write_word(constant);
        chunk.write_byte(Opcode.RETURN);

        let vm = new VM(chunk);
        let val = vm.interpret();
        expect(val).toBe(1.2)
    })
})