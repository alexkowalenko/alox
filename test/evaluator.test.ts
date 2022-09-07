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
import { SymbolTable } from '../src/symboltable';

type TestCases = [string, LoxValue, string?]

function do_tests(tests: TestCases[]) {
    const lexer = new Lexer();
    const parser = new Parser(lexer);
    const symboltable = new SymbolTable<LoxValue>;
    const evaluator = new Evaluator(symboltable);

    for (const test of tests) {
        // console.log(`token test: ${test[0]}  ${test[1]}`)
        try {
            const expr = parser.parse(test[0])
            const val = evaluator.eval(expr)
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
            ["1;", 1],
            ["1.1;", 1.1],

            // Error
            ["x", "x", "unexpected ident<x>"],
        ]
        do_tests(tests)
    })

    it('bools', () => {
        const tests: TestCases[] = [
            ["true;", true],
            ["false;", false],
        ]
        do_tests(tests)
    })

    it('nil', () => {
        const tests: TestCases[] = [
            ["nil;", null],
        ]
        do_tests(tests)
    })

    it('unary', () => {
        const tests: TestCases[] = [
            ["!true;", false],
            ["!false;", true],
            ["!!true;", true],
            ["!!!true;", false],
            ["!(false);", true],

            ["-1;", -1],
            ["--1;", 1],
            ["---1;", -1],
            ["----1;", 1],
            ["-(1);", -1],

            // Error
            ["!1;", null, "value must be a boolean"],
            [`-"hello";`, null, "value must be a number"],
        ]
        do_tests(tests)
    })

    it('plus', () => {
        const tests: TestCases[] = [
            ["1 + 2;", 3],
            ["-1 + 2;", 1],
            ["1 + -2;", -1],
            ["1 + 2 + 3;", 6],

            ['"wolf" + "man";', "wolfman"],
            ['"wolf" + "";', "wolf"],
            ['"👾" + "man";', "👾man"],

            // Error
            ["1 + true;", null, "value must be a number"],
            [`"1" + false;`, null, "value must be a string"],
            [`nil + "hello";`, null, "can't apply + to null"],
        ]
        do_tests(tests)
    })

    it('arithmetic', () => {
        const tests: TestCases[] = [
            ["1 + 2;", 3],
            ["-1 - 2;", -3],
            ["1 + 2 * 3;", 7],
            ["1 * 2 + 3;", 5],
            ["33/3;", 11],

            // Error
            ["1 * true;", null, "value must be a number"],
            [`nil / "hello";`, null, "value must be a number"],
        ]
        do_tests(tests)
    })

    it('relational', () => {
        const tests: TestCases[] = [
            ["1 < 2;", true],
            ["-1 <= 2;", true],
            ["1 > 2 * 3;", false],
            ["1 >= 2 + 3;", false],

            ["3 == 3;", true],
            ["true == true;", true],
            ["false == false;", true],
            ['"a" == "a";', true],
            ["nil == nil;", true],

            ["3 != 3;", false],
            ["true != true;", false],
            ["false != false;", false],
            ['"a" != "a";', false],
            ["nil != nil;", false],

            [`nil == "hello";`, false],

            // Error
            ["1 < true;", null, "value must be a number"],
        ]
        do_tests(tests)
    })

    it('logical', () => {
        const tests: TestCases[] = [
            ["true and true;", true],
            ["true and false;", false],

            ["true or true;", true],
            ["true or false;", true],
            ["false or false;", false],

            // Error
            ["1 and true;", null, "value must be a boolean"],
        ]
        do_tests(tests)
    })

    it('prog', () => {
        const tests: TestCases[] = [
            ["print true;", true],
        ]
        do_tests(tests)
    })

    it('var', () => {
        const tests: TestCases[] = [
            ["var x = 1;", 1],
            ["var z = 1; var y = 2.5;", 2.5],
            ["var r = 2 + 33;", 35],
            ['var 🍎 = "apple";', "apple"],

            // Error
            ["var a = 1; var a = 1;", 1, 'variable a already defined'],
        ]
        do_tests(tests)
    })



})