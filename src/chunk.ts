//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//


import { disassemble_instruction } from "./debug";
import { LoxValue } from "./runtime";
import { Opcode } from "./vm";

const DEFAULT_SIZE = 32;

export class Constant {
    constructor(private capacity: number = DEFAULT_SIZE) {
        this.pool = new Array<LoxValue>;
    }
    private pool: Array<LoxValue>;

    add_constant(val: LoxValue) {
        let pos = this.pool.findIndex((e) => { return e === val })
        if (pos >= 0) {
            return pos;
        }
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

    get end() {
        return this.count;
    }

    private extend_buffer() {
        // double the buffer
        //console.log("extend_buffer")
        let new_capacity = this.capacity * 2;

        let new_code = Buffer.alloc(new_capacity)
        this.code.copy(new_code, 0, 0, this.capacity);
        this.code = new_code;
        this.capacity = new_capacity;
    }

    write_byte(byte: number) {
        if (this.capacity < this.count + 1) {
            this.extend_buffer();
        }
        this.code.writeInt8(byte, this.count);
        this.count++;
    }

    write_word(word: number) {
        if (this.capacity < this.count + 2) {
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

    disassemble(name: string) {
        console.log(name);
        for (let offset = 0; offset < this.count;) {
            offset = disassemble_instruction(offset, this);
        }
    }
}

