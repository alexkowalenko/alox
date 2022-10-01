//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { LoxClassDef, LoxFunDef } from "../ast";
import { Function_Evaluator, LoxCallable, LoxValue } from "../runtime";
import { SymbolTable } from "../symboltable";

export class LoxFunction extends LoxCallable {

    constructor(readonly fun: LoxFunDef, readonly closure: SymbolTable<LoxValue>, public initializer: boolean) {
        super();
    }

    call(interp: Function_Evaluator, args: readonly LoxValue[]): LoxValue {
        return interp.call_function(this, args)
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

    call(interp: Function_Evaluator, args: LoxValue[]): LoxValue {
        let instance = new LoxInstance(this);
        let init = this.findMethod("init");
        if (init != null) {
            interp.call_function(init.bind(instance), args);
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
