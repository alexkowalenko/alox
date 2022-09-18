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
            ["var x;", "var x;"],

            // 
            ["var;", "", "unexpected ;, expecting <ident>"],
            ["var x 1;", "", "unexpected number<1>, expecting ;"],
            ["var x = ;", "", "unexpected ;"],
            ["var nil = 1;", "", "unexpected nil, expecting <ident>"],
            ["var true = 1;", "", "unexpected true, expecting <ident>"],
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
            ["{", "", "unexpected <eof>, expecting }"],
            ["}", "", "unexpected }"],
        ]
        do_tests(tests)
    })

    it('if', () => {
        const tests: TestCases[] = [
            ["if (true) print 1;", "if (true) print 1;"],
            ["if (true) print 1; else print 2;", "if (true) print 1 else print 2;"],
            ["if (true) {} else {print 1;}", "if (true) {} else {print 1;};"],
            ["if (true) if (true) {} else {}", "if (true) if (true) {} else {};"],

            // Error
            ["if true) print 1;", "", "unexpected true, expecting ("],
        ]
        do_tests(tests)
    })

    it('while', () => {
        const tests: TestCases[] = [
            ["while (true) print 1;", "while (true) print 1;"],
            ["while (true) { print 1; print 2;}", "while (true) {print 1;print 2;};"],
            ["while (a == b) {} ", "while ((a == b)) {};"],

            // Error
            ["while true) print 1;", "", "unexpected true, expecting ("],
        ]
        do_tests(tests)
    })

    it('for', () => {
        const tests: TestCases[] = [
            ["for (;;) true;", "for ( ; ; ) true;"],
            ["for (true;;) {}", "for ( true; ; ) {};"],
            ["for (; true ;) {}", "for ( ; true; ) {};"],
            ["for (; ;true) {}", "for ( ; ; true) {};"],
            ["for (true; true ; true) { true;}", "for ( true; true; true) {true;};"],

            // Error
            ["for true; true ; true) { true;}", "", "unexpected true, expecting ("],
            ["for (true; true ; true { true;}", "", "unexpected {, expecting )"],
        ]
        do_tests(tests)
    })

    it('break', () => {
        const tests: TestCases[] = [
            ['while(true) {break;}', 'while (true) {break;};'],
            ['for(;;) {continue;}', 'for ( ; ; ) {continue;};'],
        ]
        do_tests(tests)
    })

    it('call', () => {
        const tests: TestCases[] = [
            ['f();', 'f();'],
            ['f(g());', 'f(g());'],
            ['f(g()+h());', 'f((g() + h()));'],

            ['f(1);', 'f(1);'],
            ['f(1,g());', 'f(1, g());'],
            ['f(1, g(1, h()));', 'f(1, g(1, h()));'],

            ['f(1,x,y,z);', 'f(1, x, y, z);'],

            //
            ['f( ;', '', 'unexpected ;'],
            ['f(1, ;', '', 'unexpected ;'],
            ['f(1 1 );', '', 'unexpected <num> expecting , or ) for call expression'],

        ]
        do_tests(tests)
    })

    it('function', () => {
        const tests: TestCases[] = [
            ['fun f() {}', 'fun f(){};'],
            ['fun f(a) {}', 'fun f(a){};'],
            ['fun f(a,b) {}', 'fun f(a, b){};'],

            ['fun f() {print 1;}', 'fun f(){print 1;};'],
            ['fun f() {print 1;print 2;}', 'fun f(){print 1;print 2;};'],
            ['fun f(a) {print a;}', 'fun f(a){print a;};'],
            ['fun f(a,b) {print a;print b;}', 'fun f(a, b){print a;print b;};'],

            // Errors
            ['fun f ) {}', '', "unexpected ), expecting ("],
            ['fun f( {}', '', "unexpected {, expecting <ident>"],
            ['fun f(a, ) {}', '', "unexpected ), expecting <ident>"],
            ['fun f() }', '', "unexpected <eof>, expecting }"],
        ]
        do_tests(tests)
    })

    it('return', () => {
        const tests: TestCases[] = [
            ['return;', 'return;'],
            ['return 2;', 'return 2;'],
            ['return 2 * 8;', 'return (2 * 8);'],

            // Errors
            ['return', '', 'unexpected <eof>'],
            ['return 2 2;', '', 'unexpected number<2>, expecting ;'],
        ]
        do_tests(tests)
    })

    it('lambda', () => {
        const tests: TestCases[] = [
            ['fun(){return "a";}();', 'fun (){return "a";}();'],
            ['var f = fun (){return "a";};', 'var f = fun (){return \"a\";};'],
            ['fun(){return fun(a){return a;};}()(2);', 'fun (){return fun (a){return a;};}()(2);'],
        ]
        do_tests(tests)
    })

    it('class', () => {
        const tests: TestCases[] = [
            ['class A{}', 'class A {};'],
            ['class A{ call() {}}', 'class A {call(){} };'],
            ['class A{ call() {print 3;}}', 'class A {call(){print 3;} };'],
            ['class A{ call() {print 3;} me() {}}', 'class A {call(){print 3;} me(){} };'],

            // Error
            ['class {}', '', 'unexpected {, expecting <ident>'],
            ['class A }', '', 'unexpected }, expecting {'],
            ['class A {', '', 'unexpected <eof>, expecting <ident>'],
        ]
        do_tests(tests)
    })

    it('get', () => {
        const tests: TestCases[] = [
            ['x.s;', 'x.s;'],
            ['x.s.s;', 'x.s.s;'],
            ['x(s).s;', 'x(s).s;'],
            ['x(s)(s);', 'x(s)(s);'],
            ['x.f(s);', 'x.f(s);'],

            // Error
            ['x. ;', '', 'unexpected ;, expecting <ident>'],
            ['x s;', '', 'unexpected ident<s>, expecting ;'],
        ]
        do_tests(tests)
    })

    it('set', () => {
        const tests: TestCases[] = [
            ['x.s = 1;', 'x.s = 1;'],
            ['x.s.s = 1;', 'x.s.s = 1;'],
            ['x(s).s = 2;', 'x(s).s = 2;'],

            // Error
            ['x. = 1;', '', 'unexpected =, expecting <ident>'],
            ['x s = 2;', '', 'unexpected ident<s>, expecting ;'],
        ]
        do_tests(tests)
    })

})