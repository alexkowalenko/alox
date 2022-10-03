//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { LoxExpr } from "./ast";
import { LoxBClass, LoxBInstance, LoxBoundMethod, LoxClosure, LoxUpvalue } from "./bytecode/bytecode_runtime";
import { RuntimeError } from "./error";
import { Location } from "./token";
import { LoxClass, LoxFunction, LoxInstance } from "./tree/tree_runtime";

export interface Evaluator {
    eval(expr: LoxExpr): LoxValue;
    resolve(expr: LoxExpr, depth: number): void
}

export interface Function_Evaluator {
    call_function(f: LoxFunction, args: readonly LoxValue[]): LoxValue;
}

export abstract class LoxCallable {
    abstract call(interp: Function_Evaluator, args: Array<LoxValue>): LoxValue;
    abstract arity(): number;

    toString(): string {
        return '<native fn>'
    }
}

export type LoxValue = number | string | boolean | null | LoxCallable | LoxClass | LoxInstance | LoxClosure | LoxUpvalue | LoxBClass | LoxBInstance | LoxBoundMethod;

export function pretty_print(v: LoxValue): string {
    if (v === null) {
        return 'nil'
    }
    if (v === undefined) {
        return '<undefined>'
    }
    if (typeof v == 'string') {
        return '"' + v + '"'
    }
    return v.toString();
}

export function check_number(v: LoxValue, where: Location): number {
    if (typeof v != "number") {
        throw new RuntimeError("value must be a number", where)
    }
    return v
}

export function check_string(v: LoxValue, where: Location): string {
    if (typeof v != "string") {
        throw new RuntimeError("value must be a string", where)
    }
    return v
}

export function truthy(v: LoxValue): boolean {
    if (v == null) {
        return false;
    }
    if (typeof v === "boolean") {
        return v
    }
    return true
}

