//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { LoxFunDef, LoxIdentifier } from "../ast";
import { Function_Evaluator, LoxCallable, LoxValue } from "../runtime";
import { Chunk } from "./chunk";

import _ from 'lodash';

class Local {
    constructor(
        public name: LoxIdentifier,
        public depth: number,
        public pop = true,
        public is_captured = false,
    ) { }
}

class Upvalue {
    constructor(
        public name: LoxIdentifier,
        public index: number,
        public is_local: boolean
    ) { }

    toString() {
        return `[${this.name.id} : ${this.index}, ${this.is_local ? "local" : ""}]`
    }
}

export class LoxBoundMethod {
    constructor(
        public receiver: LoxBInstance,
        public method: LoxClosure
    ) { }

    toString() {
        return `<fn ${this.method.fn.fn.name}>`
    }
}

export const enum FunctionType {
    FUNCTION,
    METHOD,
    INITIALISER
}

function is_method_type(x: FunctionType) {
    return x === FunctionType.METHOD || x === FunctionType.INITIALISER;
}

export class CompiledFunction implements LoxCallable {

    constructor(public fn: LoxFunDef, public type: FunctionType, public parent?: CompiledFunction) {
        this.bytecodes = new Chunk;
        if (is_method_type(type)) {
            this.add_local(new LoxIdentifier(fn.location, "this"), 0, true);
        }
    }

    bytecodes: Chunk;
    scope_depth = 0;
    locals = new Array<Local>;
    upvalues = new Array<Upvalue>;

    last_continue: number | undefined = undefined;
    last_break: number | undefined = undefined;

    has_local(name: LoxIdentifier): boolean {
        return this.locals.findIndex(x => { x.name.id === name.id }) >= 0
    }

    add_local(name: LoxIdentifier, depth: number, pop: boolean) {
        this.locals.push(new Local(name, depth, pop))
    }

    find_var(v: LoxIdentifier): number {
        return _.findLastIndex(this.locals, x => x.name.id === v.id)
    }

    remove_locals() {
        this.locals = this.locals.filter((local) => {
            return local.depth <= this.scope_depth
        })
    }

    resolveUpvalue(name: LoxIdentifier): number {
        if (this.parent === undefined) {
            return -1;
        }
        let local = this.parent.find_var(name);
        if (local !== -1) {
            this.parent.locals[-local].is_captured = true;
            return this.add_upvalue(name, local, false)
        }
        return -1;
    }

    add_upvalue(name: LoxIdentifier, index: number, local: boolean): number {
        let ret = this.upvalues.findIndex(a => {
            a.index == index && a.is_local == true
        })
        if (ret >= 0) {
            return ret;
        }
        this.upvalues.push(new Upvalue(name, index, local));
        return this.upvalues.length - 1;
    }

    call(interp: Function_Evaluator, args: LoxValue[]): LoxValue {
        throw new Error("Method not implemented.");
    }

    arity(): number {
        return this.fn.args.length
    }

    toString(): string {
        return `${this.fn.name}()`
    }

    is_method() {
        return this.type === FunctionType.METHOD || this.type === FunctionType.INITIALISER;
    }

}

export class LoxClosure {
    constructor(public fn: CompiledFunction) { }
    public upvalues = new Array<LoxUpvalue>;

    toString(): string {
        return this.fn.toString() + "-c";
    }
}

export class LoxUpvalue {
    constructor(public location: LoxValue = null) { }

    toString() {
        return "Upvalue"
    }
}

export class LoxBClass {

    constructor(public name: string) {
        this.methods = new Map;
    }
    public methods: Map<string, LoxClosure>;

    arity(): number {
        return 0;
    }

    public toString() {
        return `<${this.name}>`;
    }
}

export class LoxBInstance {

    constructor(public cls: LoxBClass) { }
    public fields: Map<string, LoxValue> = new Map;

    toString(): string {
        return `<instance ${this.cls.name}>`
    }
}