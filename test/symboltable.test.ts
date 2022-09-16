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

        expect(table.has('a')).toBe(true);
        expect(table.has('b')).toBe(false);

        expect(table.get('a')).toBe('hello')
        expect(table.get('b')).toBe(undefined)

        table.assign('a', 'bom dia')
        expect(table.get('a')).toBe('bom dia')
    })

    it('nested', () => {
        let table = new SymbolTable<string>;
        table.set('a', 'hello');

        let outer = new SymbolTable<string>(table);
        outer.set('b', 'olá');

        expect(outer.has('a')).toBe(true);
        expect(outer.has('b')).toBe(true);
        expect(outer.has('c')).toBe(false);

        expect(outer.get('a')).toBe('hello')
        expect(outer.get('b')).toBe('olá')
        expect(table.get('c')).toBe(undefined)

        outer.assign('a', 'bom dia')
        expect(outer.get('a')).toBe('bom dia')
    })

    it('at', () => {
        let table = new SymbolTable<string>;
        table.set('a', 'hello');

        let inner = new SymbolTable<string>(table);
        inner.set('b', 'olá');

        expect(inner.get_at(0, 'b')).toBe('olá')
        expect(inner.get_at(1, 'a')).toBe('hello')
        expect(inner.get_at(0, 'a')).toBe(undefined)

        inner.assign_at(0, 'b', 'bom jour')
        expect(inner.get_at(0, 'b')).toBe('bom jour')

        inner.assign_at(1, 'a', 'halo')
        expect(inner.get_at(1, 'a')).toBe('halo')
    })
})