//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { Chunk } from '../src/chunk';
import { Opcode } from '../src/vm';

describe('chunk', () => {
    it('base', () => {
        let chunk = new Chunk;
        chunk.write_line(123); expect(chunk.get_byte(0)).toBe(Opcode.LINE);

        let constant = chunk.add_constant(1.2); expect(constant).toBe(0);
        chunk.write_byte(Opcode.CONSTANT); expect(chunk.get_byte(3)).toBe(Opcode.CONSTANT);
        chunk.write_word(constant);
        chunk.write_byte(Opcode.RETURN); expect(chunk.get_byte(6)).toBe(Opcode.RETURN);

        chunk.disasamble("test");
    });
});