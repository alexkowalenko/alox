//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

export class SymbolTable<T> {
    constructor(private enclosing?: SymbolTable<T>) {
        this.table = new Map<string, T>
    }

    private table: Map<string, T>

    set(name: string, value: T): void {
        this.table.set(name, value);
    }

    assign(name: string, value: T): void {
        if (this.table.has(name)) {
            this.table.set(name, value);
            return
        }
        if (this.enclosing) {
            this.enclosing.assign(name, value)
        }
    }

    get(name: string): T | undefined {
        if (this.table.has(name)) {
            return this.table.get(name)
        }
        if (this.enclosing) {
            return this.enclosing.get(name)
        }
        return undefined
    }

    has(name: string): boolean {
        return this.table.has(name)
    }
}