//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { LoxExpr, LoxNumber } from '../src/ast'
import { Printer, WritableString } from '../src/printer';

describe('Token test', () => {
    it('Tokens', () => {
        const expr: LoxExpr = new LoxNumber(2);

        const buffer = new WritableString();
        const printer: Printer = new Printer(buffer);
        printer.print(expr);
        expect(buffer.toString()).toBe("2")
    });
});