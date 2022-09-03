//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { LoxExpr, LoxNumber } from "./ast";
import { Lexer } from "./lexer";
import { Token, TokenType, Location } from "./token";

export class ParseError implements Error {

    constructor(public readonly message: string, public readonly loc: Location) { }
    public name: string = "LexError";
    stack?: string | undefined;
}

export class Parser {
    constructor(private readonly lexer: Lexer) { }

    public parse(): LoxExpr {
        return this.parseExpr()
    }

    public parseExpr(): LoxExpr {
        return this.parseNumber();
    }

    public parseNumber(): LoxNumber {
        const tok = this.expect(TokenType.NUMBER)
        return new LoxNumber(Number(tok?.value))
    }

    private expect(t: TokenType): Token {
        const tok = this.lexer.get_token();
        if (tok.tok != t) {
            throw new ParseError(`unexpected ${tok.tok}`, tok.loc)
        }
        return tok
    }
}