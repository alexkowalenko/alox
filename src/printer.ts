//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { AstVisitor, LoxExpr, LoxNumber } from "./ast";

import { Writable } from 'stream'

export class Printer implements AstVisitor {

    constructor(readonly stream: Writable) { }

    public print(expr: LoxExpr) {
        this.visitExpr(expr)
    }

    visitExpr(expr: LoxExpr): void {
        this.visitNumber(expr as LoxNumber)
    }

    visitNumber(expr: LoxNumber): void {
        this.stream.write("" + expr.value)
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