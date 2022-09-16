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

    assign_at(depth: number, name: string, value: T): void {
        if (depth === 0) {
            if (this.table.has(name)) {
                this.table.set(name, value);
                return
            }
        }
        this.enclosing?.assign_at(depth - 1, name, value)
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

    get_at(depth: number, name: string): T | undefined {
        if (depth == 0) {
            return this.table.get(name);
        }
        return this.enclosing?.get_at(depth - 1, name)
    }

    has(name: string): boolean {
        if (this.table.has(name)) {
            return true;
        }
        if (this.enclosing) {
            return this.enclosing.has(name)
        }
        return false;
    }

    has_local(name: string): boolean {
        return this.table.has(name);
    }

    dump() {
        console.log("Symbols: ----------")
        for (const s of this.table) {
            console.log(`  ${s[0]} = ${s[1]}`)
        }
        if (this.enclosing) {
            this.enclosing.dump();
        }
    }
}