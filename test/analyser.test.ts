//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { TestCases, do_tests } from "./evaluator.test"

describe('Analyser', () => {
    it('assignment to self', () => {
        const tests: TestCases[] = [
            ["var x = x;", null, "can't have local variable x in its own initializer"],
        ]
        do_tests(tests)
    })
})
