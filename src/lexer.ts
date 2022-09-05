//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { Token, TokenType, Location } from './token';
import { LineReader } from './lineReader';
import { LexError } from './error';

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

const reserved_words: Map<string, TokenType> = new Map([
    ['and', TokenType.AND],
    ['class', TokenType.CLASS],
    ['else', TokenType.ELSE],
    ['false', TokenType.FALSE],
    ['fun', TokenType.FUN],
    ['for', TokenType.FOR],
    ['if', TokenType.IF],
    ['nil', TokenType.NIL],
    ['or', TokenType.OR],
    ['print', TokenType.PRINT],
    ['return', TokenType.RETURN],
    ['super', TokenType.SUPER],
    ['this', TokenType.THIS],
    ['true', TokenType.TRUE],
    ['var', TokenType.VAR],
    ['while', TokenType.WHILE],
])

const char_zero = "0".charCodeAt(0)
const char_nine = "9".charCodeAt(0)

const alpha = /[\p{L}\p{Emoji}_]/u
const alphanumeric = /[\p{L}\p{N}\p{Emoji}]/u

export class Lexer {

    constructor(buffer: string) {
        this.line = new LineReader(buffer)
    }

    private readonly line: LineReader
    private spare_token: Token | undefined;

    private get_identifier(c: string): Token {
        let buffer = c;
        const start = this.line.get_location();
        while (this.line.peek_char().match(alphanumeric)) {
            buffer += this.line.get_char()
        }
        if (reserved_words.has(buffer)) {
            return new Token(reserved_words.get(buffer) as TokenType, start)
        }
        return new Token(TokenType.IDENT, start, buffer);
    }

    private get_string(): Token {
        let buffer = ""
        const start = this.line.get_location();
        while (this.line.peek_char() !== "") {
            const c = this.line.get_char();
            if (c === '"') {
                return new Token(TokenType.STRING, this.line.get_location(), buffer)
            }
            buffer += c
        }
        throw new LexError('Unterminated string', this.line.get_location())
    }

    private is_numeric(c: string): boolean {
        return char_zero <= c.charCodeAt(0) && c.charCodeAt(0) <= char_nine
    }

    private get_number(c: string): Token {
        let buffer = c;
        const start = this.line.get_location();
        let peek = this.line.peek_char();
        let seen_dot = false;
        while (this.is_numeric(peek as string) || peek === '.') {
            if (peek === '.') {
                if (seen_dot) {
                    break
                }
                seen_dot = true
            }
            buffer += this.line.get_char()
            peek = this.line.peek_char();
        }
        return new Token(TokenType.NUMBER, start, buffer)
    }

    public get_token(): Token {

        if (this.spare_token !== undefined) {
            const ret = this.spare_token;
            this.spare_token = undefined;
            return ret;
        }

        const char = this.line.get_char_filter()

        // If end return EOF
        if (char === "") {
            return this.mk_token(TokenType.EOF)
        }

        if (single_chars.has(char)) {
            return this.mk_token(single_chars.get(char) as TokenType)
        }
        const next = this.line.peek_char();
        switch (char) {
            case '!': {
                if (next === '=') {
                    this.line.get_char()
                    return this.mk_token(TokenType.BANG_EQUAL)
                }
                else {
                    return this.mk_token(TokenType.BANG)
                }
            }
            case '=': {
                if (next === '=') {
                    this.line.get_char()
                    return this.mk_token(TokenType.EQUAL_EQUAL)
                }
                else {
                    return this.mk_token(TokenType.EQUAL)
                }
            }
            case '>': {
                if (next === '=') {
                    this.line.get_char()
                    return this.mk_token(TokenType.GREATER_EQUAL)
                }
                else {
                    return this.mk_token(TokenType.GREATER)
                }
            }
            case '<': {
                if (next === '=') {
                    this.line.get_char()
                    return this.mk_token(TokenType.LESS_EQUAL)
                }
                else {
                    return this.mk_token(TokenType.LESS)
                }
            }
        }

        // strings
        if (char === '"') {
            return this.get_string()
        }
        if (this.is_numeric(char)) {
            return this.get_number(char)
        }
        if (char.match(alpha)) {
            return this.get_identifier(char)
        }

        throw new LexError(`Unknown character ${char}`, this.line.get_location())
    }

    private mk_token(token: TokenType) {
        return new Token(token, this.line.get_location())
    }

    public peek_token() {
        if (this.spare_token === undefined) {
            this.spare_token = this.get_token();
        }
        return this.spare_token;
    }
}
