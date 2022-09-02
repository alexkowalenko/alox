//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { Token, TokenType, Location } from "./token";

export class LexError implements Error {

    constructor(public message: string) { }
    public name: string = "LexError";
    stack?: string | undefined;
}

export class Lexer {

    constructor(private buffer: string) { }

    get_token(): Token {

        // If end return EOF
        if (this.index >= this.buffer.length) {
            return new Token(TokenType.EOF, this.get_location())
        }

        const char = this.buffer[this.index];
        switch (char) {
            case '.': return new Token(TokenType.DOT, this.get_location())
        }

        throw new LexError(`Unknown character ${char}`)
    }

    private get_location(): Location {
        return new Location(this.index, this.line_no)
    }

    private index: number = 0;
    private line_no: number = 1;

} 