//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { Lexer } from '../src/lexer'
import { LoxError } from '../src/error';
import { Parser } from '../src/parser';
import { Evaluator, LoxValue } from '../src/evaluator';

type TestCases = [string, LoxValue, string?]

function do_tests(tests: TestCases[]) {
    for (const test of tests) {
        //console.log(`token test: ${test[0]}  ${test[1]}`)
        try {
            const lexer = new Lexer(test[0]);
            const parser = new Parser(lexer);
            const evaluator = new Evaluator

            const expr = parser.parse()
            const val = evaluator.eval(expr)
            expect(val).toBe(test[1])
        }
        catch (e) {
            if (e instanceof LoxError) {
                expect(e.message).toBe(test[2])
                continue
            }
            throw e
        }
    }
}

describe('Evaluator', () => {
    it('numbers', () => {
        const tests: TestCases[] = [
            ["1", 1],
            ["1.1", 1.1],

            // Error
            ["x", "x", "unexpected ident<x>"],
        ]
        do_tests(tests)
    })

    it('bools', () => {
        const tests: TestCases[] = [
            ["true", true],
            ["false", false],
        ]
        do_tests(tests)
    })

    it('nil', () => {
        const tests: TestCases[] = [
            ["nil", null],
        ]
        do_tests(tests)
    })
})