//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//


import { LoxValue } from "./runtime";
import { constant_instruction, Opcode, simple_instruction } from "./vm";

const DEFAULT_SIZE = 8;

export class Constant {
    constructor(private capacity: number = DEFAULT_SIZE) {
        this.pool = new Array<LoxValue>;
    }
    private pool: Array<LoxValue>;

    add_constant(val: LoxValue) {
        this.pool.push(val);
        return this.pool.length - 1;
    }

    get_constant(offset: number) {
        return this.pool[offset]
    }
}

export class Chunk {
    constructor(private capacity: number = DEFAULT_SIZE) {
        this.code = Buffer.alloc(this.capacity);
        this.constants = new Constant(this.capacity);
    }
    private count = 0;
    private code: Buffer;
    private constants: Constant;

    private extend_buffer() {
        // double the buffer
        let new_capacity = this.capacity * 2;
        let new_code = Buffer.alloc(new_capacity)
        this.code.copy(new_code, 0, 0, this.capacity);
        this.code = new_code;
        this.capacity = new_capacity;
    }

    write_byte(byte: number) {
        if (this.capacity > this.count + 1) {
            this.extend_buffer();
        }
        this.code.writeInt8(byte, this.count);
        this.count++;
    }

    write_word(word: number) {
        if (this.capacity > this.count + 2) {
            this.extend_buffer();
        }
        this.code.writeInt16LE(word, this.count);
        this.count += 2;
    }

    write_line(line: number) {
        this.write_byte(Opcode.LINE);
        this.write_word(line);
    }

    get_byte(offset: number): number {
        return this.code.readInt8(offset)
    }

    get_word(offset: number): number {
        return this.code.readInt16LE(offset);
    }

    add_constant(val: LoxValue): number {
        return this.constants.add_constant(val);
    }

    get_constant(offset: number): LoxValue {
        return this.constants.get_constant(offset)
    }

    disassemble_instruction(offset: number) {
        let instr = this.code[offset];
        switch (instr) {
            case Opcode.RETURN:
                return simple_instruction(instr as Opcode, offset);
            case Opcode.CONSTANT:
                return constant_instruction(instr as Opcode, offset, this);
            case Opcode.LINE:
                return constant_instruction(instr as Opcode, offset, this);
            case Opcode.NEGATE, Opcode.ADD, Opcode.SUBTRACT, Opcode.MULTIPLY, Opcode.DIVIDE:
                return simple_instruction(instr as Opcode, offset);
        }
        return simple_instruction(instr as Opcode, offset);
    }

    disassemble(name: string) {
        console.log(name);
        for (let offset = 0; offset < this.count;) {
            offset = this.disassemble_instruction(offset);
        }
    }
}

