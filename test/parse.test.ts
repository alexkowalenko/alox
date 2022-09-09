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
    const lexer = new Lexer();
    const parser = new Parser(lexer);
    for (const test of tests) {
        //console.log(`token test: ${test[0]}  ${test[1]}`)
        try {
            const expr = parser.parse(test[0])
            const printer: Printer = new Printer();
            //console.log(printer.print(expr))
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
            ["1;", "1;"],
            ["1.1;", "1.1;"],

            // Error
            ["x;", "x;", "unexpected ident<x>"],
        ]
        do_tests(tests)
    })

    it('strings', () => {
        const tests: TestCases[] = [
            ['"1";', '"1";'],
            ['"Astérix";', '"Astérix";'],
            ['"👾🍎🇵🇹🍊🍌😀🏖🏄🏻‍♂️🍉🍷";', '"👾🍎🇵🇹🍊🍌😀🏖🏄🏻‍♂️🍉🍷";'],
            ['"";', '"";'],

            // Error
            ['"x', '', "unterminated string"],
        ]
        do_tests(tests)
    })

    it('bools', () => {
        const tests: TestCases[] = [
            ["true;", "true;"],
            ["false;", "false;"],
        ]
        do_tests(tests)
    })

    it('nil', () => {
        const tests: TestCases[] = [
            ["nil;", "nil;"],
        ]
        do_tests(tests)
    })

    it('brackets', () => {
        const tests: TestCases[] = [
            ["(nil);", "( nil );"],
            ["((nil));", "( ( nil ) );"],

            // Error
            ["(())", "", "unexpected )"],
            ["(", "", "unexpected <eof>"],
        ]
        do_tests(tests)
    })

    it('unary', () => {
        const tests: TestCases[] = [
            ["-1;", "-1;"],
            ["! true;", "!true;"],
            ["!!false;", "!!false;"],
            ["!(!false);", "!( !false );"],

            // Error
            ["+1", "", "unexpected +"],
            ["!", "", "unexpected <eof>"],
        ]
        do_tests(tests)
    })

    it('binary', () => {
        const tests: TestCases[] = [
            ["1+2;", "(1 + 2);"],
            ["2 * 3 + 4;", "((2 * 3) + 4);"],
            ["2 + 3 * 4;", "(2 + (3 * 4));"],
            ["2 + 3 * 4 / 5;", "(2 + ((3 * 4) / 5));"],

            ["1 and 2;", "(1 and 2);"],
            ["1 and 2 or 3;", "((1 and 2) or 3);"],
            ["1 or 2 and 3;", "(1 or (2 and 3));"],
            ["1 and ! 3;", "(1 and !3);"],

            ["1 < 2;", "(1 < 2);"],
            ["1 < 2 <= 3;", "((1 < 2) <= 3);"],
            ["1 > 2 >= 3;", "((1 > 2) >= 3);"],
            ["1 == 2 != 3;", "((1 == 2) != 3);"],

            // Error
            ["2 +", "", "unexpected <eof>"],
            ["* 3", "", "unexpected *"],
        ]
        do_tests(tests)
    })

    it('prog', () => {
        const tests: TestCases[] = [
            ["print 2;", "print 2;"],
            ["print 2;print 1;", "print 2;print 1;"],
            ["print 2;1;", "print 2;1;"],

            // Error
            [";", "", "unexpected ;"],
            ["print ;", "", "unexpected ;"],
        ]
        do_tests(tests)
    })

    it('comments', () => {
        const tests: TestCases[] = [
            ["print 2;// hello\nprint 1;", "print 2;print 1;"],
        ]
        do_tests(tests)
    })

    it('var', () => {
        const tests: TestCases[] = [
            ["var x = 1;", "var x = 1;"],
            ["var x = 1; var y = 2.5;", "var x = 1;var y = 2.5;"],
            ["var r = 1.4; var θ = 2.5;", "var r = 1.4;var θ = 2.5;"],

            // 
            ["var;", "", "unexpected ;"],
            ["var x;", "", "unexpected ;"],
            ["var x 1;", "", "unexpected number<1>"],
            ["var x = ;", "", "unexpected ;"],

            ["var nil = 1;", "", "unexpected nil"],
            ["var true = 1;", "", "unexpected true"],
        ]
        do_tests(tests)
    })

    it('identifiers', () => {
        const tests: TestCases[] = [
            ["x+2;", "(x + 2);"],
            ["2 * y + 4;", "((2 * y) + 4);"],
            ["x + y * z;", "(x + (y * z));"],

            ["A and B;", "(A and B);"],
            ["A and B or C;", "((A and B) or C);"],

            ["🍎 < 🍊;", "(🍎 < 🍊);"],

            // Error
            ["and +", "", "unexpected and"],
        ]
        do_tests(tests)
    })

    it('assignment', () => {
        const tests: TestCases[] = [
            ["x = 1;", "(x = 1);"],
            ["x = 1 + 4;", "(x = (1 + 4));"],
            ["x = 1 == 4;", "(x = (1 == 4));"],

            // Error
            ["x = ", "", "unexpected <eof>"],
            ["= 2 + 3", "", "unexpected ="],
        ]
        do_tests(tests)
    })

    it('block', () => {
        const tests: TestCases[] = [
            ["{}", "{}"],
            ["{x = 1 + 4;}", "{(x = (1 + 4));}"],
            ["{ print 1; print 2;}", "{print 1;print 2;}"],

            // Error
            ["{ ;", "", "unexpected ;"],
            ["{", "", "unexpected <eof>"],
            ["}", "", "unexpected }"],
        ]
        do_tests(tests)
    })

    it('if', () => {
        const tests: TestCases[] = [
            ["if (true) then print 1;", "if (true) then print 1;"],
            ["if (true) then print 1; else print 2;", "if (true) then print 1 else print 2;"],
            ["if (true) then {} else {print 1;}", "if (true) then {} else {print 1;};"],
            ["if (true) then if (true) then {} else {}", "if (true) then if (true) then {} else {};"],

            // Error
            ["if true) then print 1;", "", "unexpected true"],
            ["if (true) print 1;", "", "unexpected print"],

        ]
        do_tests(tests)
    })
})