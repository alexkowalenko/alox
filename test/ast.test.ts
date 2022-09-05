//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { LoxExpr, LoxNumber } from '../src/ast'
import { Printer } from '../src/printer';
import { Location } from '../src/token'

describe('Token test', () => {
    it('Tokens', () => {
        const expr: LoxExpr = new LoxNumber(new Location(1, 1), 2);
        const printer: Printer = new Printer();
        expect(printer.print(expr)).toBe("2")
    });
});