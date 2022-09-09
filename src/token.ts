//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

export const enum TokenType {
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
    THEN = 'then',
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

