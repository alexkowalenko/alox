//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { Lexer, LexError } from "../src/lexer";
import { TokenType } from "../src/token";

describe('Lexer', () => {
    it('tokens', () => {
        const tests: [string, TokenType][] = [
            [".", TokenType.DOT],
            [".", TokenType.EOF],
            // ["x", TokenType.DOT]
        ]

        for (const test of tests) {
            console.log(`token test: ${test[0]}`)
            try {
                var lexer = new Lexer(test[0]);
                expect(lexer.get_token().tok).toBe(test[1])
            }
            catch (e) {
                if (e instanceof LexError) {
                    console.log(`Error: ${e.message}`)
                    expect(e).toBeNull()
                }
            }
        }
        //expect(1).toBe(0)
    })
})