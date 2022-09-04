//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { Lexer } from '../src/lexer'
import { LoxError } from '../src/error';
import { Parser } from '../src/parser';
import { Printer } from '../src/printer';

type TestCases = [string, string, string?]

function do_tests(tests: TestCases[]) {
    for (const test of tests) {
        //console.log(`token test: ${test[0]}  ${test[1]}`)
        try {
            const lexer = new Lexer(test[0]);
            const parser = new Parser(lexer);

            const expr = parser.parse()
            const printer: Printer = new Printer();
            expect(printer.print(expr)).toBe(test[1])
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

describe('Parser', () => {
    it('numbers', () => {
        const tests: TestCases[] = [
            ["1", "1"],
            ["1.1", "1.1"],

            // Error
            ["x", "x", "unexpected ident<x>"],
        ]
        do_tests(tests)
    })

    it('bools', () => {
        const tests: TestCases[] = [
            ["true", "true"],
            ["false", "false"],
        ]
        do_tests(tests)
    })

    it('nil', () => {
        const tests: TestCases[] = [
            ["nil", "nil"],
        ]
        do_tests(tests)
    })

    it('brackets', () => {
        const tests: TestCases[] = [
            ["(nil)", "( nil )"],
            ["((nil))", "( ( nil ) )"],

            // Error
            ["(())", "", "unexpected )"],
            ["(", "", "unexpected <eof>"],
        ]
        do_tests(tests)
    })

    it('unary', () => {
        const tests: TestCases[] = [
            ["-1", "-1"],
            ["! true", "!true"],
            ["!!false", "!!false"],
            ["!(!false)", "!( !false )"],

            // Error
            ["+1", "", "unexpected +"],
            ["!", "", "unexpected <eof>"],
        ]
        do_tests(tests)
    })

    it('binary', () => {
        const tests: TestCases[] = [
            ["1+2", "(1 + 2)"],
            ["2 * 3 + 4", "((2 * 3) + 4)"],
            ["2 + 3 * 4", "(2 + (3 * 4))"],
            ["2 + 3 * 4 / 5", "(2 + ((3 * 4) / 5))"],

            ["1 and 2", "(1 and 2)"],
            ["1 and 2 or 3", "((1 and 2) or 3)"],
            ["1 or 2 and 3", "(1 or (2 and 3))"],
            ["1 and ! 3", "(1 and !3)"],

            ["1 < 2", "(1 < 2)"],
            ["1 < 2 <= 3", "((1 < 2) <= 3)"],
            ["1 > 2 >= 3", "((1 > 2) >= 3)"],
            ["1 == 2 != 3", "((1 == 2) != 3)"],

            // Error
            ["2 +", "", "unexpected <eof>"],
            ["* 3", "", "unexpected *"],
        ]
        do_tests(tests)
    })
})