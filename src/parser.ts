//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { LoxBinary, LoxBool, LoxExpr, LoxGroup, LoxNil, LoxNumber, LoxPrint, LoxProgram, LoxStatement, LoxString, LoxUnary } from "./ast";
import { Lexer } from "./lexer";
import { Token, TokenType } from "./token";
import { ParseError } from "./error";

type PrefixParselet = (p: Parser) => LoxExpr;

const prefix_map: Map<TokenType, PrefixParselet> = new Map([
    [TokenType.NUMBER, (p: Parser) => { return p.number() }],
    [TokenType.STRING, (p: Parser) => { return p.string() }],
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

export const enum Precedence {
    LOWEST = 0,
    OR,
    AND,
    COMPARATIVE,
    CONCAT,
    SUM,
    PRODUCT,
    UNARY,
    EXPONENT
}

const precedence_map = new Map<TokenType, Precedence>([
    [TokenType.OR, Precedence.OR],
    [TokenType.AND, Precedence.AND],
    [TokenType.EQUAL_EQUAL, Precedence.COMPARATIVE],
    [TokenType.BANG_EQUAL, Precedence.COMPARATIVE],
    [TokenType.LESS, Precedence.COMPARATIVE],
    [TokenType.LESS_EQUAL, Precedence.COMPARATIVE],
    [TokenType.GREATER, Precedence.COMPARATIVE],
    [TokenType.GREATER_EQUAL, Precedence.COMPARATIVE],
    [TokenType.PLUS, Precedence.CONCAT],
    // [TokenType.MINUS, Precedence.SUM],
    [TokenType.SLASH, Precedence.PRODUCT],
    [TokenType.ASTÉRIX, Precedence.PRODUCT],
    [TokenType.BANG, Precedence.UNARY],
    [TokenType.MINUS, Precedence.UNARY],
])

export function get_precedence(t: TokenType): Precedence {
    if (precedence_map.has(t)) {
        return precedence_map.get(t) as Precedence
    }
    return Precedence.LOWEST
}

export class Parser {
    constructor(private readonly lexer: Lexer) { }

    public parse(line: string): LoxProgram {
        this.lexer.set_line(line)
        return this.program()
    }

    private program(): LoxProgram {
        let prog = new LoxProgram();
        do {
            let statement = this.statement();
            if (statement === null) {
                break
            }
            this.expect(TokenType.SEMICOLON)
            prog.statements.push(statement);
        } while (true)
        return prog
    }

    private statement(): LoxStatement | null {
        let tok = this.lexer.peek_token();
        switch (tok.tok) {
            case TokenType.PRINT:
                return this.print();
            case TokenType.EOF:
                return null;
            default:
                return this.expr()
        }
    }

    private print(): LoxPrint {
        let tok = this.lexer.get_token();
        let expr = this.expr();
        return new LoxPrint(tok.loc, expr);
    }

    /**
     * Parser for expressions using Pratt operator precedence parsing.
     * 
     * @param precedence Prat level
     * @returns 
     */
    private expr(precedence: Precedence = Precedence.LOWEST): LoxExpr {
        // console.log('expr')

        // check prefix operator
        let tok = this.lexer.peek_token();
        //console.log(`got prefix token: ${tok}`)
        if (!prefix_map.has(tok.tok)) {
            throw new ParseError(`unexpected ${tok}`, tok.loc)
        }
        //Parse the left hand expression
        let left = (prefix_map.get(tok.tok) as PrefixParselet)(this)

        // check infix
        tok = this.lexer.peek_token();
        //console.log(`got infix  token: ${tok}`)
        //console.log(`compare precedence ${precedence} : ${get_precedence(tok.tok)}`)
        while (precedence < get_precedence(tok.tok)) {
            // console.log(`do infix: ${tok}`)
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
        const token = this.lexer.get_token();
        const tok = token.tok;
        const expr = this.expr(get_precedence(tok))
        return new LoxUnary(token.loc, tok, expr)
    }

    binary(left: LoxExpr): LoxBinary {
        const token = this.lexer.get_token();
        const operator = token.tok;
        const precedence = get_precedence(operator);
        const right = this.expr(precedence);
        return new LoxBinary(token.loc, operator, left, right)
    }

    group(): LoxGroup {
        // console.log(`parseGroup`)
        const token = this.lexer.get_token() // '('
        const expr = this.expr(Precedence.LOWEST)
        const group = new LoxGroup(token.loc, expr)
        this.expect(TokenType.R_PAREN) // ')'
        return group
    }

    number(): LoxNumber {
        const tok = this.expect(TokenType.NUMBER)
        return new LoxNumber(tok.loc, Number(tok?.value))
    }

    string(): LoxString {
        const tok = this.expect(TokenType.STRING)
        return new LoxString(tok.loc, tok?.value as string)
    }

    bool(): LoxBool {
        const tok = this.lexer.get_token();
        let bool = false;
        if (tok.tok === TokenType.TRUE) {
            bool = true;
        }
        return new LoxBool(tok.loc, bool)
    }

    nil(): LoxNil {
        const tok = this.expect(TokenType.NIL)
        return new LoxNil(tok.loc)
    }

    private expect(t: TokenType): Token {
        const tok = this.lexer.get_token();
        if (tok.tok != t) {
            throw new ParseError(`unexpected ${tok}`, tok.loc)
        }
        return tok
    }
}