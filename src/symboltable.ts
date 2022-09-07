//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

export class SymbolTable<T> {
    constructor() {
        this.table = new Map<string, T>
    }

    private table: Map<string, T>

    set(name: string, value: T): void {
        this.table.set(name, value);
    }

    get(name: string) {
        return this.table.get(name)
    }
}