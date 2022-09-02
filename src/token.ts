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
    DOT = ',',
    MINUS = '-',
    PLUS = '+',
    SEMICOLON = ';',
    SLASH = '/',
    ASTERIX = '*',

    BANG = '!',
    BANG_EQUAL = '!=',
    EQUAL = '=',
    EQUAL_EQUAL = '==',
    GREATER = '>',
    GREATER_EQUAL = '>=',
    LESS = '<',
    LESS_EQUAL = '<=',

    INDENT = '<ident>',
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
    VAR = 'var',
    WHILE = 'while',

    EOF = '<eof>'
}


export class Location {
    constructor(public line: number = 1, public pos: number = 1) { }
}

export class Token {
    constructor(public tok: TokenType, public loc: Location, public value?: string) { }
}


