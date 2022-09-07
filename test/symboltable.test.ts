//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { SymbolTable } from "../src/symboltable"

describe('SymbolTable', () => {
    it('basic', () => {
        let table = new SymbolTable<string>;

        table.set('a', 'hello');
        expect(table.get('a')).toBe('hello')
        expect(table.get('b')).toBe(undefined)
    })
})