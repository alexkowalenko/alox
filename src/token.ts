//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

export enum TokenType {
    L_PAREN = '(',
    R_PAREN = ')',
    L_BRACE = '{',
    R_BRACE = '}',
    COMMA = ',',
    DOT = '.',
    MINUS = '-',
    PLUS = '+',
    SEMICOLON = ';',
    SLASH = '/',
    ASTÉRIX = '*',
    COLON = ':',

    BANG = '!',
    BANG_EQUAL = '!=',
    EQUAL = '=',
    EQUAL_EQUAL = '==',
    GREATER = '>',
    GREATER_EQUAL = '>=',
    LESS = '<',
    LESS_EQUAL = '<=',

    IDENT = '<ident>',
    STRING = '<string>',
    NUMBER = '<num>',

    AND = 'and',
    CLASS = 'class',
    ELSE = 'else',
    FALSE = 'false',
    FUN = 'fun',
    FOR = 'for',
    IF = 'if',
    NIL = 'nil',
    OR = 'or',
    PRINT = 'print',
    RETURN = 'return',
    SUPER = 'super',
    THIS = 'this',
    TRUE = 'true',
    VAR = 'var',
    WHILE = 'while',

    EOF = '<eof>'
}

export class Location {
    constructor(public readonly line: number = 1, public readonly pos: number = 1) { }

    toString(): string {
        return `[${this.line},${this.pos}]`
    }
}

export class Token {
    constructor(public readonly tok: TokenType, public readonly loc: Location, public readonly value?: string) { }

    public toString(): string {
        switch (this.tok) {
            case TokenType.IDENT:
                return `ident<${this.value}>`
            case TokenType.NUMBER:
                return `number<${this.value}>`
            case TokenType.STRING:
                return `"${this.value}"`
            default:
                return this.tok
        }
    }
}

export enum Precedence {
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

const precedence_map: Map<TokenType, Precedence> = new Map<TokenType, Precedence>([
    [TokenType.OR, Precedence.OR],
    [TokenType.AND, Precedence.AND],
    [TokenType.EQUAL_EQUAL, Precedence.COMPARATIVE],
    [TokenType.BANG_EQUAL, Precedence.COMPARATIVE],
    [TokenType.LESS, Precedence.COMPARATIVE],
    [TokenType.LESS_EQUAL, Precedence.COMPARATIVE],
    [TokenType.GREATER, Precedence.COMPARATIVE],
    [TokenType.GREATER_EQUAL, Precedence.COMPARATIVE],
    [TokenType.PLUS, Precedence.CONCAT],
    [TokenType.MINUS, Precedence.SUM],
    [TokenType.SLASH, Precedence.PRODUCT],
    [TokenType.ASTÉRIX, Precedence.PRODUCT],
    [TokenType.BANG, Precedence.UNARY],
])

export function get_precedence(t: TokenType): Precedence {
    if (precedence_map.has(t)) {
        return precedence_map.get(t) as Precedence
    }
    return Precedence.LOWEST
}