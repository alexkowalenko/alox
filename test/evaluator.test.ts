//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//


import { LoxError } from '../src/error';
import { Interpreter, Options } from '../src/interpreter';

export type TestCases = [string, string, string?]

export function do_tests(tests: TestCases[]) {
    const opts = new Options;
    opts.silent = true;
    const interpreter = new Interpreter(opts);

    for (const test of tests) {
        try {
            const val = interpreter.do(test[0]);
            expect(interpreter.pretty_print(val)).toBe(test[1])
        }
        catch (e) {
            if (e instanceof LoxError) {
                // console.log(`token test: ${test[0]}  ${test[1]}`)
                expect(e.message).toBe(test[2])
                continue
            }
            console.log(`expect: ${test[0]}`)
            throw e
        }
    }
}

describe('Evaluator', () => {
    it('numbers', () => {
        const tests: TestCases[] = [
            ["1;", '1'],
            ["1.1;", '1.1'],
        ]
        do_tests(tests)
    })

    it('bools', () => {
        const tests: TestCases[] = [
            ["true;", 'true'],
            ["false;", 'false'],
        ]
        do_tests(tests)
    })

    it('nil', () => {
        const tests: TestCases[] = [
            ["nil;", 'nil'],
        ]
        do_tests(tests)
    })

    it('unary', () => {
        const tests: TestCases[] = [
            ["!true;", 'false'],
            ["!false;", 'true'],
            ["!!true;", 'true'],
            ["!!!true;", 'false'],
            ["!(false);", 'true'],

            ["-1;", '-1'],
            ["--1;", '1'],
            ["---1;", '-1'],
            ["----1;", '1'],
            ["-(1);", '-1'],

            // Error
            ["!1;", '', "value must be a boolean"],
            [`-"hello";`, '', "value must be a number"],
        ]
        do_tests(tests)
    })

    it('plus', () => {
        const tests: TestCases[] = [
            ["1 + 2;", '3'],
            ["-1 + 2;", '1'],
            ["1 + -2;", '-1'],
            ["1 + 2 + 3;", '6'],

            ['"wolf" + "man";', '"wolfman"'],
            ['"wolf" + "";', '"wolf"'],
            ['"👾" + "man";', '"👾man"'],

            // Error
            ["1 + true;", 'null', "value must be a number"],
            [`"1" + false;`, 'null', "value must be a string"],
            [`nil + "hello";`, 'null', "can't apply + to null"],
        ]
        do_tests(tests)
    })

    it('arithmetic', () => {
        const tests: TestCases[] = [
            ["1 + 2;", '3'],
            ["-1 - 2;", '-3'],
            ["1 + 2 * 3;", '7'],
            ["1 * 2 + 3;", '5'],
            ["33/3;", '11'],
            ["2 - 6 / 3;", '0'],

            // Error
            ["1 * true;", 'null', "value must be a number"],
            [`nil / "hello";`, 'null', "value must be a number"],
        ]
        do_tests(tests)
    })

    it('relational', () => {
        const tests: TestCases[] = [
            ["1 < 2;", 'true'],
            ["-1 <= 2;", 'true'],
            ["1 > 2 * 3;", 'false'],
            ["1 >= 2 + 3;", 'false'],

            ["3 == 3;", 'true'],
            ["true == true;", 'true'],
            ["false == false;", 'true'],
            ['"a" == "a";', 'true'],
            ["nil == nil;", 'true'],

            ["3 != 3;", 'false'],
            ["true != true;", 'false'],
            ["false != false;", 'false'],
            ['"a" != "a";', 'false'],
            ["nil != nil;", 'false'],

            [`nil == "hello";`, 'false'],

            // Error
            ["1 < true;", 'null', "value must be a number"],
        ]
        do_tests(tests)
    })

    it('logical', () => {
        const tests: TestCases[] = [
            ["true and true;", 'true'],
            ["true and false;", 'false'],

            ["true or true;", 'true'],
            ["true or false;", 'true'],
            ["false or false;", 'false'],

            ["1 or nil;", '1'],
            ["nil or 2;", '2'],
        ]
        do_tests(tests)
    })

    it('prog', () => {
        const tests: TestCases[] = [
            ["print true;", 'true'],
        ]
        do_tests(tests)
    })

    it('var', () => {
        const tests: TestCases[] = [
            ["var x = 1;", '1'],
            ["var z = 1; var y = 2.5;", '2.5'],
            ["var r = 2 + 33;", '35'],
            ['var 🍎 = "apple";', '"apple"'],
            ['var xx = 99; xx < 10;', 'false'],

            ["var a;", 'nil'],

            // Error
            ["var a = 1; var a = 1;", '1', 'variable a already defined'],
        ]
        do_tests(tests)
    })

    it('identifiers', () => {
        const tests: TestCases[] = [
            ["var x = 1;", '1'],
            ["x + 1;", '2'],
            ["var y = 2;", '2'],
            ["x + y * y;", '5'],
            ["var r = 2 + 33;", '35'],
            ['var 🍎 = true;', 'true'],
            ['(r == 35) and 🍎;', 'true'],

            // Error
            ["b + 1;", 'null', 'identifier b not found'],
        ]
        do_tests(tests)
    })

    it('assignment', () => {
        const tests: TestCases[] = [
            ["var x = 1;", '1'],
            ["x + 1;", '2'],
            ["x = 27;", '27'],
            ["x + 1;", '28'],
            ["var y = 2;", '2'],
            ["x = x + y;", '29'],

            // Error
            ["b = 1;", 'null', 'undefined variable b'],
            ["x + 1 = 1;", 'null', "can't assign to (x + 1)"],
        ]
        do_tests(tests)
    })

    it('block', () => {
        const tests: TestCases[] = [
            ["{}", 'nil'],
            ["{var x = 1 + 4;}", '5'],
            ["{ print 1; print 2;}", '2'],

            ["var z = 1;{z + 4;}", '5'],
            ["var y = 1;{var y = 2; y + 4;}", '6'], // shadow
        ]
        do_tests(tests)
    })

    it('if', () => {
        const tests: TestCases[] = [
            ["if (true == true) 1;", '1'],
            ["if (true == false) 1; else 2;", '2'],
            ["if (5 == 5) if (5 != 5) 3; else 4;", '4'],
        ]
        do_tests(tests)
    })

    it('while', () => {
        const tests: TestCases[] = [
            ["var x = 4; while (x > 1) x = x - 1; x;", '1'],
            ["x = 4; while (false) { x = x - 1; } x;", '4'],
        ]
        do_tests(tests)
    })

    it('for', () => {
        const tests: TestCases[] = [
            ["var x = 1; for( ; x < 10; x = x + 1) {} x;", '10'],
            ["for(x = 1; x < 10; x = x + 1) {} x;", '10'],
            ["for(x = 1; x < 10; ) {x = x + 1;} x;", '10'],

            ["for(var x = 1; x < 10; x = x + 1) {}", 'nil'],
            // check no leakage of variable into outer environment
            ["for(var x = 1; x < 10; x = x + 1) {}", 'nil'],
        ]
        do_tests(tests)
    })

    it('break', () => {
        const tests: TestCases[] = [
            ["while(true) break;", 'nil'],
            ["var x; for(x = 1; x < 10; x = x + 1) {continue; x= 20;} x;", '10'],
            ["for(x = 1; x < 10; x = x + 1) {continue; x = 30;} x;", '10'],

            ["x = 1; while(true) { x=x+1; if(x>10) break; } x;", '11'],
        ]
        do_tests(tests)
    })

    it('stdlib', () => {
        const tests: TestCases[] = [
            ["clock() - clock();", '0'],
            // errors
            ["tick() - clock();", '0', "identifier tick not found"],
        ]
        do_tests(tests)
    })

    it('function', () => {
        const tests: TestCases[] = [
            ["fun f() {} f();", 'nil'],
            ["fun f(a) {a;} f(1);", '1'],
            ["fun f(a) {a;} f(1+3);", '4'],
            ["fun g(a,b) {a+ b;} g(1,3);", '4'],
            ["g(f(3),3);", '6'],
            // errors
            ["f(1,2);", 'null', "function f called with 2 arguments, expecting 1"],
            ["f();", 'null', "function f called with 0 arguments, expecting 1"],
        ]
        do_tests(tests)
    })

    it('return', () => {
        const tests: TestCases[] = [
            ["fun f() {return 1;} f();", '1'],
            ["fun f(a) {return a;} f(1);", '1'],
            ["fun g(a,b) {return a+ b;} g(1,3);", '4'],
            ["g(f(3),3);", '6'],
            // errors
            ["return;", 'null', "no enclosing function to return from"],
        ]
        do_tests(tests)
    })

    it('lambda', () => {
        const tests: TestCases[] = [
            ['fun(){return "a";}();', '"a"'],
            ['var f = fun(){return "a";}; f();', '"a"'],
            ['fun(){return fun(a){return a;};}()(2);', '2'],
        ]
        do_tests(tests)
    })

    it('class', () => {
        const tests: TestCases[] = [
            ['class A{}', '<A>'],
            ['class A{} var x = A(); x;', '<instance A>'],
        ]
        do_tests(tests)
    })

    it('get set', () => {
        const tests: TestCases[] = [
            ['class A{} var x = A(); x.s = 1;', '1'],
            ['x.s;', '1'],
            ['x.c = 2;', '2'],
            ['x.c;', '2'],
            ['class B{} x.d = B();', '<instance B>'],
            ['x.d.g = 7;', '7'],
            ['x.d.g;', '7'],
            ['x.c;', '2'],
            ['x.s;', '1'],

            // Errors
            ['x = 1; x.s;', '', 'only objects have properties'],
            ['class X{} x = X(); x.s;', '', 'undefined property s'],
        ]
        do_tests(tests)
    })
})