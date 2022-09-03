//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { AstVisitor, LoxBool, LoxExpr, LoxLiteral, LoxNil, LoxNumber } from "./ast";

import { Writable } from 'stream'

export class Printer extends AstVisitor {

    constructor(readonly stream: Writable) { super() }

    public print(expr: LoxExpr) {
        expr.accept(this)
    }

    visitNumber(expr: LoxNumber): void {
        this.stream.write("" + expr.value)
    }

    visitBool(expr: LoxBool): void {
        this.stream.write(expr.toString())
    }

    visitNil(expr: LoxNil): void {
        this.stream.write(expr.toString())
    }
}

export class WritableString extends Writable {

    constructor() {
        super()
    }
    private buffer: string = ""

    _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null | undefined) => void): void {
        this.buffer += "" + chunk;
    }

    public toString(): string {
        return this.buffer;
    }
}