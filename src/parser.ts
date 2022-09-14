//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { ForInit, LoxBinary, LoxBlock, LoxBool, LoxBreak, LoxCall, LoxDeclaration, LoxExpr, LoxFor, LoxFun, LoxGroup, LoxIdentifier, LoxIf, LoxNil, LoxNumber, LoxPrint, LoxProgram, LoxReturn, LoxStatement, LoxString, LoxUnary, LoxVar, LoxWhile } from "./ast";
import { Lexer } from "./lexer";
import { Token, TokenType } from "./token";
import { ParseError } from "./error";

const MAX_PARAMS = 255;

type PrefixParselet = (p: Parser) => LoxExpr;

const prefix_map: Map<TokenType, PrefixParselet> = new Map([
    [TokenType.IDENT, (p: Parser) => { return p.identifier() }],
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
    [TokenType.OR, call_binary],
    [TokenType.EQUAL, call_binary],
    [TokenType.L_PAREN, (p: Parser, left: LoxExpr): LoxExpr => {
        return p.call(left);
    }]
])

export const enum Precedence {
    LOWEST = 0,
    ASSIGNMENT,
    OR,
    AND,
    EQUALS,
    COMPARATIVE,
    CONCAT,
    SUM,
    PRODUCT,
    UNARY,
    EXPONENT,
    CALL,
}

const precedence_map = new Map<TokenType, Precedence>([
    [TokenType.OR, Precedence.OR],
    [TokenType.AND, Precedence.AND],
    [TokenType.EQUAL_EQUAL, Precedence.EQUALS],
    [TokenType.BANG_EQUAL, Precedence.EQUALS],
    [TokenType.LESS, Precedence.COMPARATIVE],
    [TokenType.LESS_EQUAL, Precedence.COMPARATIVE],
    [TokenType.GREATER, Precedence.COMPARATIVE],
    [TokenType.GREATER_EQUAL, Precedence.COMPARATIVE],
    [TokenType.PLUS, Precedence.CONCAT],
    [TokenType.MINUS, Precedence.SUM],
    [TokenType.SLASH, Precedence.PRODUCT],
    [TokenType.ASTÉRIX, Precedence.PRODUCT],
    [TokenType.BANG, Precedence.UNARY],
    //[TokenType.MINUS, Precedence.UNARY],
    [TokenType.EQUAL, Precedence.ASSIGNMENT],
    [TokenType.L_PAREN, Precedence.CALL]
])

export function get_precedence(t: TokenType): Precedence {
    if (precedence_map.has(t)) {
        return precedence_map.get(t)!
    }
    return Precedence.LOWEST
}

const stat_map = new Map<TokenType, PrefixParselet>([
    [TokenType.PRINT, (p: Parser) => { return p.print() }],
    [TokenType.L_BRACE, (p: Parser) => { return p.block() }],
    [TokenType.IF, (p: Parser) => { return p.if() }],
    [TokenType.WHILE, (p: Parser) => { return p.while() }],
    [TokenType.FOR, (p: Parser) => { return p.for() }],
    [TokenType.BREAK, (p: Parser) => { return p.break() }],
    [TokenType.CONTINUE, (p: Parser) => { return p.break() }],
    [TokenType.RETURN, (p: Parser) => { return p.ret() }],
])

export class Parser {
    constructor(private readonly lexer: Lexer) { }

    private enclosing_loop = 0;

    public parse(line: string): LoxProgram {
        this.lexer.set_line(line)
        return this.program()
    }

    private program(): LoxProgram {
        let prog = new LoxProgram();
        do {
            let declaration = this.declaration();
            if (declaration === null) {
                break
            }
            prog.statements.push(declaration);
        } while (true)
        return prog
    }

    private declaration(): LoxDeclaration | null {
        let tok = this.lexer.peek_token();
        switch (tok.tok) {
            case TokenType.VAR:
                return this.var();
            case TokenType.FUN:
                return this.fun();
            default:
                return this.statement();
        }
    }

    private var(): LoxVar {
        const tok = this.expect(TokenType.VAR)
        let id = this.identifier()
        const ast = new LoxVar(tok.loc, id);
        let t = this.lexer.peek_token();
        if (t.tok == TokenType.EQUAL) {
            this.expect(TokenType.EQUAL)
            ast.expr = this.expr();
        }
        this.expect(TokenType.SEMICOLON);
        return ast;
    }

    private fun(): LoxFun {
        var tok = this.expect(TokenType.FUN)
        let id = this.identifier()
        let ast = new LoxFun(tok.loc, id);
        this.expect(TokenType.L_PAREN)
        tok = this.lexer.peek_token();
        while (tok.tok != TokenType.R_PAREN) {
            let id = this.identifier();
            ast.args.push(id);
            tok = this.lexer.peek_token();
            if (tok.tok == TokenType.COMMA) {
                this.lexer.get_token();
                continue;
            }
            if (tok.tok == TokenType.R_PAREN) {
                break;
            }
            throw new ParseError(`unexpected token ${tok.tok}, expecting , or )`, tok.loc)
        }
        this.expect(TokenType.R_PAREN)
        if (ast.args.length > MAX_PARAMS) {
            throw new ParseError(`exceeded maximum numbers of parameters`, tok.loc)
        }
        ast.body = this.block();
        return ast;
    }

    private statement(): LoxStatement | null {
        let tok = this.lexer.peek_token();
        if (tok.tok == TokenType.EOF) {
            return null;
        }
        if (stat_map.has(tok.tok)) {
            return stat_map.get(tok.tok)!(this);
        }
        const e = this.expr();
        this.expect(TokenType.SEMICOLON)
        return e;
    }

    public if(): LoxIf {
        let tok = this.expect(TokenType.IF)
        this.expect(TokenType.L_PAREN)
        const expr = this.expr();
        const paren = this.expect(TokenType.R_PAREN)
        const then = this.statement();
        if (!then) {
            throw new ParseError("expecting statements after )", paren.loc)
        }
        const ast = new LoxIf(tok.loc, expr, then!);
        tok = this.lexer.peek_token();
        if (tok.tok == TokenType.ELSE) {
            this.expect(TokenType.ELSE)
            const else_stat = this.statement();
            if (!else_stat) {
                throw new ParseError("expecting statements after else", tok.loc)
            }
            ast.else = else_stat;
        }
        return ast;
    }

    public while(): LoxWhile {
        let tok = this.expect(TokenType.WHILE)
        this.expect(TokenType.L_PAREN)
        const expr = this.expr();
        const paren = this.expect(TokenType.R_PAREN)
        this.enclosing_loop++;
        const stats = this.statement();
        this.enclosing_loop--;
        if (!stats) {
            throw new ParseError("expecting statements after )", paren.loc)
        }
        return new LoxWhile(tok.loc, expr, stats!);
    }

    public for(): LoxFor {
        let tok = this.expect(TokenType.FOR)
        var ast = new LoxFor(tok.loc);
        this.expect(TokenType.L_PAREN)
        tok = this.lexer.peek_token();
        if (tok.tok != TokenType.SEMICOLON) {
            if (tok.tok == TokenType.VAR) {
                ast.init = this.var();
            } else {
                ast.init = this.expr();
                this.expect(TokenType.SEMICOLON)
            }
        } else {
            this.expect(TokenType.SEMICOLON)
        }

        tok = this.lexer.peek_token();
        if (tok.tok != TokenType.SEMICOLON) {
            ast.cond = this.expr();
        }
        this.expect(TokenType.SEMICOLON)

        tok = this.lexer.peek_token();
        if (tok.tok != TokenType.R_PAREN) {
            ast.iter = this.expr();
        }
        this.expect(TokenType.R_PAREN)
        this.enclosing_loop++;
        var stat = this.statement();
        this.enclosing_loop--;
        if (stat) {
            ast.stat = stat
        }
        return ast;
    }

    public print(): LoxPrint {
        let tok = this.lexer.get_token(); // print
        let expr = this.expr();
        this.expect(TokenType.SEMICOLON)
        return new LoxPrint(tok.loc, expr);
    }

    public break(): LoxBreak {
        let tok = this.lexer.get_token();
        if (this.enclosing_loop == 0) {
            throw new ParseError(`no enclosing loop statement for ${tok.tok}`, tok.loc)
        }
        this.expect(TokenType.SEMICOLON)
        return new LoxBreak(tok.loc, tok.tok);
    }

    public ret(): LoxReturn {
        let tok = this.lexer.get_token();
        let ast = new LoxReturn(tok.loc);
        let next = this.lexer.peek_token()
        if (next.tok != TokenType.SEMICOLON) {
            ast.expr = this.expr();
        }
        this.expect(TokenType.SEMICOLON)
        return ast;
    }

    public block(): LoxBlock {
        let tok = this.lexer.get_token(); // {
        let ast = new LoxBlock(tok.loc)
        let peek = this.lexer.peek_token();
        while (peek.tok != TokenType.R_BRACE) {
            const decl = this.declaration();
            if (decl === null) {
                break
            }
            ast.statements.push(decl);
            peek = this.lexer.peek_token();
        }
        this.expect(TokenType.R_BRACE)
        return ast
    }

    /**
     * Parser for expressions using Pratt operator precedence parsing.
     * 
     * @param precedence Prat level
     * @returns 
     */
    private expr(precedence: Precedence = Precedence.LOWEST): LoxExpr {
        //console.log('expr')

        // check prefix operator
        let tok = this.lexer.peek_token();
        //console.log(`got prefix token: ${tok}`)
        if (!prefix_map.has(tok.tok)) {
            throw new ParseError(`unexpected ${tok}`, tok.loc)
        }
        //Parse the left hand expression
        let left = (prefix_map.get(tok.tok)!)(this)

        // check infix
        tok = this.lexer.peek_token();
        //console.log(`got infix  token: ${tok}`)
        //console.log(`compare precedence ${precedence} : ${get_precedence(tok.tok)}`)
        while (precedence < get_precedence(tok.tok)) {
            //console.log(`do infix: ${tok}`)
            if (!infix_map.has(tok.tok)) {
                throw new ParseError(`unexpected ${tok} in expression`, tok.loc)
            }
            left = (infix_map.get(tok.tok)!)(this, left)
            tok = this.lexer.peek_token();
        }
        return left
    }

    unary(): LoxUnary {
        //console.log('unary')
        const token = this.lexer.get_token();
        const tok = token.tok;
        const expr = this.expr(get_precedence(tok))
        return new LoxUnary(token.loc, tok, expr);
    }

    call(left: LoxExpr): LoxUnary {
        //console.log('call')
        var token = this.expect(TokenType.L_PAREN)
        var ast = new LoxCall(token.loc);
        var next = this.lexer.peek_token();
        while (next.tok != TokenType.R_PAREN) {
            ast.arguments.push(this.expr());
            next = this.lexer.peek_token();
            if (next.tok == TokenType.COMMA) {
                this.lexer.get_token();
                continue;
            }
            if (next.tok == TokenType.R_PAREN) {
                break;
            }
            throw new ParseError(`unexpected ${next.tok} expecting , or ) for call expression`, token.loc)
        }
        this.lexer.get_token();
        if (ast.arguments.length > MAX_PARAMS) {
            throw new ParseError(`exceeded maximum numbers of arguments`, token.loc)
        }
        var u = new LoxUnary(left.location, undefined, left);
        u.call = ast;
        return u;
    }

    binary(left: LoxExpr): LoxBinary {
        //console.log('binary')
        const token = this.lexer.get_token();
        const operator = token.tok;
        const precedence = get_precedence(operator);
        const right = this.expr(precedence);
        return new LoxBinary(token.loc, operator, left, right)
    }

    group(): LoxGroup {
        // console.log(`group`)
        const token = this.lexer.get_token() // '('
        const expr = this.expr(Precedence.LOWEST)
        const group = new LoxGroup(token.loc, expr)
        this.expect(TokenType.R_PAREN) // ')'
        return group
    }

    identifier(): LoxIdentifier {
        var tok = this.expect(TokenType.IDENT);
        return new LoxIdentifier(tok.loc, tok.value!)
    }

    number(): LoxNumber {
        const tok = this.expect(TokenType.NUMBER)
        return new LoxNumber(tok.loc, Number(tok?.value))
    }

    string(): LoxString {
        const tok = this.expect(TokenType.STRING)
        return new LoxString(tok.loc, tok?.value!)
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
            throw new ParseError(`unexpected ${tok}, expecting ${t}`, tok.loc)
        }
        return tok
    }
}