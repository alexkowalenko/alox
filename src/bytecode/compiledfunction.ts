//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { LoxFunDef, LoxIdentifier } from "../ast";
import { LoxFunction } from "../runtime";
import { SymbolTable } from "../symboltable";
import { Chunk } from "./chunk";

import _ from 'lodash';

class Local {
    constructor(
        public name: LoxIdentifier,
        public depth: number,
        public pop = true
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

export class CompiledFunction extends LoxFunction {

    constructor(public fn: LoxFunDef, public parent?: CompiledFunction) {
        super(fn, new SymbolTable, false)
        this.bytecodes = new Chunk;
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

    search_upvalue(count: number, name: LoxIdentifier): number {
        if (this.parent) {
            if (this.parent.has_local(name)) {
                return count;
            }
            return this.parent.search_upvalue(count + 1, name)
        }
        return -1;
    }
}