//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { Lexer } from '../src/lexer'
import { LoxError } from '../src/error';
import { Parser } from '../src/parser';
import { Evaluator, LoxValue } from '../src/evaluator';
import { Printer } from '../src/printer';

type TestCases = [string, LoxValue, string?]

function do_tests(tests: TestCases[]) {
    const lexer = new Lexer();
    const parser = new Parser(lexer);
    const evaluator = new Evaluator();

    for (const test of tests) {
        //console.log(`token test: ${test[0]}  ${test[1]}`)
        try {
            const expr = parser.parse(test[0])
            const val = evaluator.eval(expr)
            //console.log(test[0])
            //const printer: Printer = new Printer();
            //console.log(printer.print(expr))
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

    it('unary', () => {
        const tests: TestCases[] = [
            ["!true", false],
            ["!false", true],
            ["!!true", true],
            ["!!!true", false],
            ["!(false)", true],

            ["-1", -1],
            ["--1", 1],
            ["---1", -1],
            ["----1", 1],
            ["-(1)", -1],

            // Error
            ["!1", null, "value must be a boolean"],
            [`-"hello"`, null, "value must be a number"],
        ]
        do_tests(tests)
    })

    it('plus', () => {
        const tests: TestCases[] = [
            ["1 + 2", 3],
            ["-1 + 2", 1],
            ["1 + -2", -1],
            ["1 + 2 + 3", 6],

            ['"wolf" + "man"', "wolfman"],
            ['"wolf" + ""', "wolf"],
            ['"👾" + "man"', "👾man"],

            // Error
            ["1 + true", null, "value must be a number"],
            [`"1" + false`, null, "value must be a string"],
            [`nil + "hello"`, null, "can't apply + to null"],
        ]
        do_tests(tests)
    })
})