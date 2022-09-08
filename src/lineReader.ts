//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { Location } from './token'

export class LineReader {

    constructor(private buffer: string = "") {
        this.set_buffer(buffer)
    }

    public set_buffer(buffer: string) {
        this.buffer = buffer;
        this.index = 0;
        this.char_no = 1;
        this.line_no = 1;
    }

    private index: number = 0;
    private char_no: number = 1;
    private line_no: number = 1;

    public get_location(): Location {
        return new Location(this.line_no, this.char_no)
    }

    public get_char(): string {
        if (this.index >= this.buffer.length) {
            return ""
        }
        const [char, incr] = this.getWholeCharAndI(this.index);
        this.index += incr; // could be unicode index adds 2, char adds 1.
        this.char_no++;
        //console.log(`char: ${char} index: ${this.index}  incr: ${incr}`)
        return char
    }

    public get_char_filter(): string {
        do {
            let char = this.get_char();
            // console.log(`get_char filter: "${char}"`)
            if (char === "") { // empty character must be returned first
                return char;
            }
            if (" \t\r".includes(char)) {
                continue
            }
            if ('\n' === char) {
                this.line_no++;
                this.char_no = 1;
                continue
            }
            if (char === '/' && this.peek_char() == '/') {
                // comments
                do {
                    char = this.get_char();
                } while (char !== '\n' && char != "")
                continue
            }
            return char
        } while (true)
    }

    public peek_char(): string {
        if (this.index >= this.buffer.length) {
            return ""
        }
        return this.getWholeCharAndI(this.index)[0]
    }

    private getWholeCharAndI(i: number): [string, number] {
        const code = this.buffer.charCodeAt(i);

        if (Number.isNaN(code)) {
            return ['', 0];  // Position not found
        }
        if (code < 0xD800 || code > 0xDFFF) {
            return [this.buffer.charAt(i), 1];  // Normal character, keeping 'i' the same
        }

        // High surrogate (could change last hex to 0xDB7F to treat high private
        // surrogates as single characters)
        if (0xD800 <= code && code <= 0xDBFF) {
            if (this.buffer.length <= (i + 1)) {
                throw new Error('High surrogate without following low surrogate');
            }
            const next = this.buffer.charCodeAt(i + 1)
            if (next < 0xDC00 || next > 0xDFFF) {
                throw new Error('High surrogate without following low surrogate');
            }
            return [this.buffer.charAt(i) + this.buffer.charAt(i + 1), 2];
        }

        // Low surrogate (0xDC00 <= code && code <= 0xDFFF)
        if (i === 0) {
            throw new Error('Low surrogate without preceding high surrogate');
        }

        const prev = this.buffer.charCodeAt(i - 1);

        // (could change last hex to 0xDB7F to treat high private surrogates
        // as single characters)
        if (prev < 0xD800 || prev > 0xDBFF) {
            throw new Error('Low surrogate without preceding high surrogate');
        }

        // Return the next character instead (and increment)
        return [this.buffer.charAt(i + 1), 2];
    }
}