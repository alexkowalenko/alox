//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { LoxBool, LoxExpr, LoxGroup, LoxNil, LoxNumber, LoxUnary } from "./ast";
import { Lexer } from "./lexer";
import { Token, TokenType, Location, Precedence } from "./token";
import { ParseError } from "./error";

type PrefixParselet = (p: Parser) => LoxExpr;

const prefix_map: Map<TokenType, PrefixParselet> = new Map([
    [TokenType.NUMBER, (p: Parser) => { return p.parseNumber() }],
    [TokenType.TRUE, (p: Parser) => { return p.parseBool() }],
    [TokenType.FALSE, (p: Parser) => { return p.parseBool() }],
    [TokenType.NIL, (p: Parser) => { return p.parseNil() }],
    [TokenType.L_PAREN, (p: Parser) => { return p.parseGroup() }],
    [TokenType.MINUS, (p: Parser) => { return p.parseUnary() }],
    [TokenType.BANG, (p: Parser) => { return p.parseUnary() }],
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
    private parseExpr(precedence: Precedence): LoxExpr {
        const tok = this.lexer.peek_token();
        // console.log(`got token: ${tok}`)
        if (!prefix_map.has(tok.tok)) {
            throw new ParseError(`unexpected ${tok}`, tok.loc)
        }
        return (prefix_map.get(tok.tok) as PrefixParselet)(this)
    }

    parseUnary(): LoxUnary {
        const tok = this.lexer.get_token().tok;
        const expr = this.parseExpr(Precedence.LOWEST)
        return new LoxUnary(tok, expr)
    }

    parseGroup(): LoxGroup {
        // console.log(`parseGroup`)
        this.lexer.get_token() // '('
        const expr = this.parseExpr(Precedence.LOWEST)
        const group = new LoxGroup(expr)
        this.expect(TokenType.R_PAREN) // ')'
        return group
    }

    parseNumber(): LoxNumber {
        const tok = this.expect(TokenType.NUMBER)
        return new LoxNumber(Number(tok?.value))
    }

    parseBool(): LoxBool {
        const tok = this.lexer.get_token();
        var bool = false;
        if (tok.tok === TokenType.TRUE) {
            bool = true;
        }
        return new LoxBool(bool)
    }

    parseNil(): LoxNil {
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