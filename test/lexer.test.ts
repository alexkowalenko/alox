//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { Lexer, LexError } from '../src/lexer'
import { TokenType } from '../src/token'

describe('Lexer', () => {
    it('tokens', () => {
        const tests: [string, TokenType][] = [
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
        ]

        for (const test of tests) {
            //console.log(`token test: ${test[0]}  ${test[1]}`)
            try {
                var lexer = new Lexer(test[0]);
                const tok = lexer.get_token().tok;
                //console.log(`token tok: ${tok}  ${test[1]}`)
                expect(tok).toBe(test[1])
            }
            catch (e) {
                if (e instanceof LexError) {
                    console.log(`Error: ${e.message}`)
                }
                throw e
            }
        }
    })
})