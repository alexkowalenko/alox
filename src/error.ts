//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { Location } from "./token"

export class LoxError implements Error {
    constructor(public readonly message: string, public readonly loc: Location, public name: string) { }

    public toString(): string {
        return `${this.loc} ${this.name}: ${this.message}`
    }
}

export class LexError extends LoxError {
    constructor(public readonly message: string, public readonly loc: Location) {
        super(message, loc, "Lexical error")
    }
}

export class ParseError extends LoxError {
    constructor(public readonly message: string, public readonly loc: Location) {
        super(message, loc, "Parse error")
    }
}

export class RuntimeError extends LoxError {
    constructor(public readonly message: string, public readonly loc: Location) {
        super(message, loc, "Run time exception")
    }
}