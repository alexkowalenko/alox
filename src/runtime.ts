//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { LoxClassDef, LoxFunDef, LoxReturn } from "./ast";
import { RuntimeError } from "./error";
import { TreeEvaluator } from "./evaluator";
import { SymbolTable } from "./symboltable";
import { Location } from "./token";

export abstract class LoxCallable {
    abstract call(interp: TreeEvaluator, args: Array<LoxValue>): LoxValue;
    abstract arity(): number;

    toString(): string {
        return '<native fn>'
    }
}

export type LoxValue = number | string | boolean | null | LoxCallable | LoxClass | LoxInstance

export function pretty_print(v: LoxValue): string {
    if (v === null) {
        return 'nil'
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

export class LoxFunction extends LoxCallable {

    constructor(readonly fun: LoxFunDef, readonly closure: SymbolTable<LoxValue>, public initializer: boolean) {
        super();
    }

    // Todo: This needs to move back into the Evaluator class, and have a generic Evaluator interface.
    call(interp: TreeEvaluator, args: readonly LoxValue[]): LoxValue {
        let prev = interp.symboltable
        interp.symboltable = new SymbolTable(this.closure);
        for (let i = 0; i < args.length; i++) {
            interp.symboltable.set(this.fun.args[i].id, args[i])
        }
        let val: LoxValue = null;
        try {
            val = interp.visitBlock(this.fun.body!)
        }
        catch (e) {
            if (e instanceof LoxReturn) {
                val = e.value;
            } else {
                throw e;
            }
        }
        finally {
            interp.symboltable = prev
        }
        if (this.initializer) {
            return this.closure.get_at(0, "this")!;
        }
        return val;
    }

    bind(instance: LoxInstance): LoxFunction {
        let env = new SymbolTable<LoxValue>(this.closure);
        env.set("this", instance);
        return new LoxFunction(this.fun, env, this.initializer);
    }

    arity(): number {
        return this.fun.args.length
    }

    toString(): string {
        return `<fn ${this.fun.name ?? ''}>`
    }
}

export class LoxInstance {
    constructor(public readonly cls: LoxClass) { }
    private fields: Map<string, LoxValue> = new Map;

    get(name: string): LoxValue | undefined {
        return this.fields.get(name)
    }

    set(name: string, value: LoxValue) {
        this.fields.set(name, value)
    }

    toString(): string {
        return `<instance ${this.cls.name}>`;
    }
}

export class LoxClass extends LoxCallable {
    constructor(readonly cls: LoxClassDef) {
        super()

    }
    public super_class?: LoxClass;
    public methods: Map<string, LoxFunction> = new Map;

    call(interp: TreeEvaluator, args: LoxValue[]): LoxValue {
        let instance = new LoxInstance(this);
        let init = this.findMethod("init");
        if (init != null) {
            init.bind(instance).call(interp, args);
        }
        return instance;
    }

    arity(): number {
        let init = this.findMethod('init');
        if (init === undefined) {
            return 0;
        }
        return init.arity();
    }

    get name(): string {
        return this.cls.name.id
    }

    findMethod(name: string): LoxFunction | undefined {
        if (this.methods.has(name)) {
            return this.methods.get(name)
        }
        if (this.super_class) {
            return this.super_class.findMethod(name);
        }
        return undefined
    }

    toString(): string {
        return `<${this.cls.name.id}>`;
    }
}
