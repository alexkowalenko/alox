//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { LoxBinary, LoxBool, LoxExpr, LoxGroup, LoxNil, LoxNumber, LoxUnary } from "./ast";
import { Lexer } from "./lexer";
import { Token, TokenType, Location, Precedence, get_precedence } from "./token";
import { ParseError } from "./error";

type PrefixParselet = (p: Parser) => LoxExpr;

const prefix_map: Map<TokenType, PrefixParselet> = new Map([
    [TokenType.NUMBER, (p: Parser) => { return p.number() }],
    [TokenType.TRUE, (p: Parser) => { return p.bool() }],
    [TokenType.FALSE, (p: Parser) => { return p.bool() }],
    [TokenType.NIL, (p: Parser) => { return p.nil() }],
    [TokenType.L_PAREN, (p: Parser) => { return p.group() }],
    [TokenType.MINUS, (p: Parser) => { return p.unary() }],
    [TokenType.BANG, (p: Parser) => { return p.unary() }],
])

type InfixParselet = (P: Parser, left: LoxExpr) => LoxExpr;

function call_binary(p: Parser, left: LoxExpr): LoxExpr {
    return p.binary(left)
}

const infix_map: Map<TokenType, InfixParselet> = new Map([
    [TokenType.PLUS, call_binary],
    [TokenType.MINUS, call_binary],
    [TokenType.SLASH, call_binary],
    [TokenType.ASTÉRIX, call_binary],
    [TokenType.EQUAL_EQUAL, call_binary],
    [TokenType.BANG_EQUAL, call_binary],
    [TokenType.LESS, call_binary],
    [TokenType.LESS_EQUAL, call_binary],
    [TokenType.GREATER, call_binary],
    [TokenType.GREATER_EQUAL, call_binary],
    [TokenType.AND, call_binary],
    [TokenType.OR, call_binary]
])

export class Parser {
    constructor(private readonly lexer: Lexer) { }

    public parse(): LoxExpr {
        return this.expr(Precedence.LOWEST)
    }

    /**
     * Parser for expressions using Pratt operator precedence parsing.
     * 
     * @param precedence Prat level
     * @returns 
     */
    private expr(precedence: Precedence): LoxExpr {
        // console.log('expr')

        // check infix operator
        var tok = this.lexer.peek_token();
        // console.log(`got token: ${tok}`)
        if (!prefix_map.has(tok.tok)) {
            throw new ParseError(`unexpected ${tok}`, tok.loc)
        }
        var left = (prefix_map.get(tok.tok) as PrefixParselet)(this)

        // check infix
        tok = this.lexer.peek_token();
        // console.log(`got token: ${tok}`)
        while (precedence < get_precedence(tok.tok)) {
            if (!infix_map.has(tok.tok)) {
                throw new ParseError(`unexpected ${tok} in expression`, tok.loc)
            }
            left = (infix_map.get(tok.tok) as InfixParselet)(this, left)
            tok = this.lexer.peek_token();
        }
        return left
    }

    unary(): LoxUnary {
        // console.log('unary')
        const tok = this.lexer.get_token().tok;
        const expr = this.expr(Precedence.LOWEST)
        return new LoxUnary(tok, expr)
    }

    binary(left: LoxExpr): LoxBinary {
        const operator = this.lexer.get_token().tok;
        const precedence = get_precedence(operator);
        const right = this.expr(precedence);
        return new LoxBinary(operator, left, right)
    }

    group(): LoxGroup {
        // console.log(`parseGroup`)
        this.lexer.get_token() // '('
        const expr = this.expr(Precedence.LOWEST)
        const group = new LoxGroup(expr)
        this.expect(TokenType.R_PAREN) // ')'
        return group
    }

    number(): LoxNumber {
        const tok = this.expect(TokenType.NUMBER)
        return new LoxNumber(Number(tok?.value))
    }

    bool(): LoxBool {
        const tok = this.lexer.get_token();
        var bool = false;
        if (tok.tok === TokenType.TRUE) {
            bool = true;
        }
        return new LoxBool(bool)
    }

    nil(): LoxNil {
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