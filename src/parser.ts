//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { LoxBool, LoxExpr, LoxNil, LoxNumber } from "./ast";
import { Lexer } from "./lexer";
import { Token, TokenType, Location, Precedence } from "./token";
import { ParseError } from "./error";

type PrefixParselet = (p: Parser) => LoxExpr;

const prefix_map: Map<TokenType, PrefixParselet> = new Map([
    [TokenType.NUMBER, (p: Parser) => { return p.parseNumber() }],
    [TokenType.TRUE, (p: Parser) => { return p.parseBool() }],
    [TokenType.FALSE, (p: Parser) => { return p.parseBool() }],
    [TokenType.NIL, (p: Parser) => { return p.parseNil() }],
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

    public parseBool(): LoxBool {
        const tok = this.lexer.get_token();
        var bool = false;
        if (tok.tok === TokenType.TRUE) {
            bool = true;
        }
        return new LoxBool(bool)
    }

    public parseNil(): LoxNil {
        const tok = this.expect(TokenType.NIL)
        return new LoxNil()
    }

    private expect(t: TokenType): Token {
        const tok = this.lexer.get_token();
        if (tok.tok != t) {
            throw new ParseError(`unexpected ${tok}`, tok.loc)
        }
        return tok
    }
}