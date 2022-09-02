//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { Lexer, LexError } from '../src/lexer'
import { TokenType } from '../src/token'

type TestCases = [string, TokenType, string?]

function do_tests(tests: TestCases[]) {
    for (const test of tests) {
        //console.log(`token test: ${test[0]}  ${test[1]}`)
        try {
            var lexer = new Lexer(test[0]);
            const tok = lexer.get_token().tok;
            //console.log(`token tok: ${tok}  ${test[1]}`)
            expect(tok).toBe(test[1])
            if (test[1] === TokenType.STRING) {
                expect(test[0].slice(1, -1)).toBe(test[2])
            }
        }
        catch (e) {
            if (e instanceof LexError) {
                console.log(`Error: ${e.message}`)
            }
            throw e
        }
    }
}

describe('Lexer', () => {
    it('tokens', () => {
        const tests: TestCases[] = [
            [".", TokenType.DOT],
            ["(", TokenType.L_PAREN],
            [")", TokenType.R_PAREN],
            ["{", TokenType.L_BRACE],
            ["}", TokenType.R_BRACE],
            [",", TokenType.COMMA],
            ["-", TokenType.MINUS],
            ["+", TokenType.PLUS],
            ["*", TokenType.ASTÉRIX],
            ["/", TokenType.SLASH],
            [":", TokenType.COLON],

            ["!", TokenType.BANG],
            ["!=", TokenType.BANG_EQUAL],
            ["=", TokenType.EQUAL],
            ["==", TokenType.EQUAL_EQUAL],
            [">", TokenType.GREATER],
            [">=", TokenType.GREATER_EQUAL],
            ["<", TokenType.LESS],
            ["<=", TokenType.LESS_EQUAL],
        ]
        do_tests(tests)
    })
    it('strings', () => {
        const tests: TestCases[] = [
            ['"abc"', TokenType.STRING, "abc"],
            ['"a"', TokenType.STRING, "a"],
            ['""', TokenType.STRING, ""],
            ['"Astérix"', TokenType.STRING, "Astérix"],
            ['"estação"', TokenType.STRING, "estação"],
            ['"χαῖρε"', TokenType.STRING, "χαῖρε"],
            ['"👾"', TokenType.STRING, "👾"],
            ['"こんにちは"', TokenType.STRING, "こんにちは"],
            ['"👾🍎🇵🇹🍊🍌😀🏖🏄🏻‍♂️🍉🍷"', TokenType.STRING, "👾🍎🇵🇹🍊🍌😀🏖🏄🏻‍♂️🍉🍷"],
        ]
        do_tests(tests)
    })

})