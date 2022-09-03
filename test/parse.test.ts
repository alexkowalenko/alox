//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { Lexer, LexError } from '../src/lexer'
import { Parser, ParseError } from '../src/parser';
import { Printer, WritableString } from '../src/printer';

type TestCases = [string, string]

function do_tests(tests: TestCases[]) {
    for (const test of tests) {
        //console.log(`token test: ${test[0]}  ${test[1]}`)
        try {
            const lexer = new Lexer(test[0]);
            const parser = new Parser(lexer);

            const expr = parser.parse()
            var buffer = new WritableString();
            var printer: Printer = new Printer(buffer);
            printer.print(expr);

            expect(buffer.toString()).toBe(test[1])
        }
        catch (e) {
            if (e instanceof LexError) {
                console.log(`Lex error: ${e.message}`)
            }
            if (e instanceof ParseError) {
                console.log(`Parse error: ${e.message}`)
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
            // ["x", "x"],
        ]
        do_tests(tests)
    })
})