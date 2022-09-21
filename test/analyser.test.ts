//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { TestCases, do_tests } from "./evaluator.test"

describe('Analyser', () => {
    it('assignment to self', () => {
        const tests: TestCases[] = [
            ["var x = x;", 'null', "can't have local variable x in its own initializer"],
        ]
        do_tests(tests)
    })

    it('break', () => {
        const tests: TestCases[] = [
            // Error
            ['break;', '', 'no enclosing loop statement for break'],
            ['continue;', '', 'no enclosing loop statement for continue'],
        ]
        do_tests(tests)
    })

    it('return', () => {
        const tests: TestCases[] = [
            // errors
            ["return;", 'null', "no enclosing function to return from"],
        ]
        do_tests(tests)
    })

    it('this', () => {
        const tests: TestCases[] = [
            // errors
            ["this;", 'null', "can't use 'this' outside of a class"],
        ]
        do_tests(tests)
    })

    it('init', () => {
        const tests: TestCases[] = [
            // errors
            ["class A{init() {return 22;}}", '', "can't return a value from an initializer"],
        ]
        do_tests(tests)
    })

    it('super', () => {
        const tests: TestCases[] = [
            // errors
            ["class A < A {init() {return 22;}}", '', "a class can't inherit from itself"],
        ]
        do_tests(tests)
    })
})
