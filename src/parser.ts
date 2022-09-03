//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { LoxExpr, LoxNumber } from "./ast";
import { Lexer } from "./lexer";
import { Token, TokenType, Location, Precedence } from "./token";
import { ParseError } from "./error";

type PrefixParselet = (p: Parser) => LoxExpr;

const prefix_map: Map<TokenType, PrefixParselet> = new Map([
    [TokenType.NUMBER, (p: Parser) => { return p.parseNumber() }]
])

export class Parser {
    constructor(private readonly lexer: Lexer) { }

    public parse(): LoxExpr {
        return this.parseExpr(Precedence.LOWEST)
    }

    /**
     * Parser for expressions using Pratt operator precedence parsing.
     * 
     * @param precedence Prat level
     * @returns 
     */
    public parseExpr(precedence: Precedence): LoxExpr {
        const tok = this.lexer.peek_token();
        if (!prefix_map.has(tok.tok)) {
            throw new ParseError(`unexpected ${tok}`, tok.loc)
        }
        return (prefix_map.get(tok.tok) as PrefixParselet)(this)
    }

    public parseNumber(): LoxNumber {
        const tok = this.expect(TokenType.NUMBER)
        return new LoxNumber(Number(tok?.value))
    }

    private expect(t: TokenType): Token {
        const tok = this.lexer.get_token();
        if (tok.tok != t) {
            throw new ParseError(`unexpected ${tok}`, tok.loc)
        }
        return tok
    }
}