//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { Token, TokenType, Location } from './token'

export class LexError implements Error {

    constructor(public message: string, public loc: Location) { }
    public name: string = "LexError";
    stack?: string | undefined;
}

const single_chars: Map<string, TokenType> = new Map([
    ['.', TokenType.DOT],
    ['(', TokenType.L_PAREN],
    [')', TokenType.R_PAREN],
    ['{', TokenType.L_BRACE],
    ['}', TokenType.R_BRACE],
    [',', TokenType.COMMA],
    ['-', TokenType.MINUS],
    ['+', TokenType.PLUS],
    ['/', TokenType.SLASH],
    ['*', TokenType.ASTÉRIX],
    [':', TokenType.COLON],
])

export class Lexer {

    constructor(private buffer: string) { }

    get_token(): Token {
        const char = this.get_char()
        // If end return EOF
        if (char === "") {
            return this.mk_token(TokenType.EOF)
        }

        if (single_chars.has(char)) {
            return this.mk_token(single_chars.get(char) as TokenType)
        }
        const next = this.peek_char();
        switch (char) {
            case '!': {
                if (next === '=')
                    return this.mk_token(TokenType.BANG_EQUAL)
                else
                    return this.mk_token(TokenType.BANG)
            }
            case '=': {
                if (next === '=')
                    return this.mk_token(TokenType.EQUAL_EQUAL)
                else
                    return this.mk_token(TokenType.EQUAL)
            }
            case '>': {
                if (next === '=')
                    return this.mk_token(TokenType.GREATER_EQUAL)
                else
                    return this.mk_token(TokenType.GREATER)
            }
            case '<': {
                if (next === '=')
                    return this.mk_token(TokenType.LESS_EQUAL)
                else
                    return this.mk_token(TokenType.LESS)
            }
        }

        // strings
        if (char === '"') {
            var buffer: Buffer = Buffer.alloc(20);
            const start = this.get_location();
            while (this.index < this.buffer.length) {
                var c = this.buffer[this.index];
                this.incr_count();
                if (c === '"') {
                    return new Token(TokenType.STRING, this.get_location(), buffer.toString())
                }
                buffer.write(c)
            }
            throw new LexError('Unterminated string', this.get_location())
        }

        throw new LexError(`Unknown character ${char}`, this.get_location())
    }

    mk_token(token: TokenType) {
        return new Token(token, this.get_location())
    }

    get_char() {
        do {
            if (this.index >= this.buffer.length) {
                return ""
            }
            var char = this.buffer[this.index];
            if (" \t\r".includes(char)) {
                this.incr_count()
                continue
            }
            if ('\n' === char) {
                this.line_no++;
                this.char_no = 1;
                continue;
            }
            this.index++;
            this.char_no++;
            return char
        } while (true)
    }

    peek_char() {
        if (this.index >= this.buffer.length) {
            return ""
        }
        return this.buffer[this.index];
    }

    incr_count() {
        this.index++
        this.char_no++
    }

    private get_location(): Location {
        return new Location(this.char_no, this.line_no)
    }

    private index: number = 0;
    private char_no: number = 1;
    private line_no: number = 1;

}
