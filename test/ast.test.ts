//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { LoxExpr, LoxNumber } from '../src/ast'
import { Printer, WritableString } from '../src/printer';

describe('Token test', () => {
    it('Tokens', () => {
        var expr: LoxExpr = new LoxNumber(2);

        var buffer = new WritableString();
        var printer: Printer = new Printer(buffer);
        printer.print(expr);
        //console.log(`print: ${buffer.toString()}`)
        expect(buffer.toString()).toBe("2")
    });
});