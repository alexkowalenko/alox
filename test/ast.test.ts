//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { LoxExpr, LoxNumber } from '../src/ast'
import { Printer } from '../src/printer';

describe('Token test', () => {
    it('Tokens', () => {
        const expr: LoxExpr = new LoxNumber(2);
        const printer: Printer = new Printer();
        expect(printer.print(expr)).toBe("2")
    });
});