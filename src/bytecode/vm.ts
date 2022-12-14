//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { Chunk } from "./chunk";
import { disassemble_instruction } from "./debug";
import { RuntimeError } from "../error";
import { Options } from "../interpreter";
import { check_number, check_string, Function_Evaluator, LoxCallable, LoxValue, pretty_print, truthy } from "../runtime";
import { Location } from "../token";
import { SymbolTable } from "../symboltable";
import { CompiledFunction, LoxBInstance, LoxBoundMethod, LoxClosure, LoxUpvalue } from "./bytecode_runtime";

import os from "os";
import _, { isArguments } from 'lodash';
import { LoxFunction } from "../tree/tree_runtime";
import { LoxBClass } from "./bytecode_runtime"


export const enum Opcode {
    CONSTANT,
    RETURN,
    LINE, // Debug instruction, No-op
    NEGATE,
    ADD,
    SUBTRACT,
    MULTIPLY,
    DIVIDE,
    NIL,
    TRUE,
    FALSE,
    NOT,
    AND,
    OR,
    EQUAL,
    LESS,
    GREATER,
    POP,
    PRINT,
    DEF_GLOBAL,
    GET_GLOBAL,
    SET_GLOBAL,
    DEF_LOCAL,
    GET_LOCAL,
    SET_LOCAL,
    GET_UPVALUE,
    SET_UPVALUE,
    POP_LOCAL,
    JMP_IF_FALSE,
    JMP_IF_TRUE,
    JUMP,
    CALL,
    CLOSURE,
    CLASS,
    INHERIT,
    GET_PROPERTY,
    SET_PROPERTY,
    METHOD,
}

class Frame {
    constructor(public previous_stack_ptr: number,
        public chunk: Chunk,
        public frame_ptr: number = 0,
    ) { };
    public ip: number = 0;
    public arity: number = 0;
    public last_line: number = 0;
    public cl: LoxClosure | undefined = undefined
}

class Null_Eval implements Function_Evaluator {
    call_function(f: LoxFunction, args: readonly LoxValue[]): LoxValue {
        return null;
    }
}

const null_eval = new Null_Eval;

export class VM {
    constructor(chunk: Chunk, private symboltable: SymbolTable<LoxValue>, private options: Options) {
        this.stack = new Array;
        this.frame_stack = new Array;
        this.frame_stack.push(new Frame(0, chunk));
    }
    private stack: Array<LoxValue>;
    private frame_stack: Array<Frame>;

    public debug = true;

    current(): Frame {
        return this.frame_stack.at(-1)!
    }

    stack_length() {
        return this.stack.length;
    }

    set_stack_length(n: number) {
        this.stack.length = n;
    }

    stack_get_location(i: number) {
        return this.stack[this.current().frame_ptr + i]
    }

    stack_set_location(i: number, val: LoxValue) {
        this.stack[this.current().frame_ptr + i] = val;
    }

    pop_frame() {
        let val = this.pop()!; // save final value before removing the frame.
        let last_frame = this.frame_stack.pop()!
        this.set_stack_length(last_frame.previous_stack_ptr - last_frame.arity - 1)
        this.push(val);
        return
    }

    pop() {
        return this.stack.pop()
    }

    push(val: LoxValue) {
        this.stack.push(val)
    }

    peek(index: number = 0): LoxValue {
        return this.stack.at(-1 - index)!
    }

    get_location(): Location {
        return new Location(this.current().last_line, 0);
    }

    check_number(index: number = 0) {
        check_number(this.peek(index), this.get_location());
    }

    check_string(index: number = 0) {
        check_string(this.peek(index), this.get_location());
    }

    get_word_arg() {
        let val = this.current().chunk.get_constant(this.current().chunk.get_word(this.current().ip))
        this.current().ip += 2;
        return val;
    }

    get_byte() {
        let val = this.current().chunk.get_byte(this.current().ip);
        this.current().ip++;
        return val;
    }

    get_word() {
        let val = this.current().chunk.get_word(this.current().ip);
        this.current().ip += 2;
        return val;
    }

    interpret() {
        if (this.debug) {
            console.log("START:")
        }
        for (; ;) {
            if (this.current().ip >= this.current().chunk.end) {
                if (this.frame_stack.length > 1) {
                    this.pop_frame();
                    continue;
                }
                return this.pop() ?? null;
            }
            let instr = this.current().chunk.get_byte(this.current().ip);
            if (this.debug) {
                disassemble_instruction(this.current().ip, this.current().chunk);
            }
            this.current().ip++;
            switch (instr) {
                case Opcode.RETURN: {
                    if (this.frame_stack.length > 1) {
                        // console.log("RETURN")
                        this.pop_frame();
                        break;
                    }
                    let val = this.pop() ?? null;
                    return val;
                }

                case Opcode.CALL: {
                    let arity = this.get_byte();
                    var cl = this.peek(arity);
                    if (cl instanceof LoxClosure) {
                        if (cl.fn.arity() !== arity) {
                            throw new RuntimeError(`function ${cl.fn.fn.name?.id} called with ${arity} arguments, expecting ${cl.fn.arity()}`,
                                this.get_location())
                        }
                        this.call(cl, arity)
                        // execute function
                        break;
                    } else if (cl instanceof LoxCallable) {
                        //console.log("LoxCallable")
                        // Native function
                        let args: Array<LoxValue> = new Array;
                        _.range(0, cl.arity()).forEach(
                            i => args.push(this.peek(i)));
                        this.pop(); // pop the function off the stack.
                        this.push(cl.call(null_eval, args))
                        break;
                    } else if (cl instanceof LoxBClass) {
                        if (!cl.methods.has("init")) {
                            if (arity != 0) {
                                throw new RuntimeError(`function ${cl.name} called with ${arity} arguments, expecting ${cl.arity()}`,
                                    this.get_location())
                            }
                        }
                        let instance = new LoxBInstance(cl);
                        if (cl.methods.has("init")) {
                            let method = cl.methods.get("init")!;
                            if (arity !== method.fn.arity()) {
                                throw new RuntimeError(`function ${cl.name} called with ${arity} arguments, expecting ${method.fn.arity()}`,
                                    this.get_location())
                            }
                            this.invoke_method(instance, method, arity);
                        }
                        this.stack.push(instance)
                        break;
                    } else if (cl instanceof LoxBoundMethod) {
                        if (cl.method.fn.arity() != arity) {
                            throw new RuntimeError(`function ${cl.method.fn.fn.name.id} called with ${arity} arguments, expecting ${cl.method.fn.arity()}`,
                                this.get_location())
                        }
                        this.invoke_method(cl.receiver, cl.method, arity);
                        break;
                    }
                    else {
                        throw new RuntimeError(`can't call ${cl}`, this.get_location())
                    }
                }

                case Opcode.CLOSURE: {
                    let fn = this.get_word_arg();
                    let closure = new LoxClosure(fn as CompiledFunction);
                    this.push(closure as unknown as LoxValue);
                    for (let i = 0; i < closure.upvalues.length; i++) {
                        let is_local = this.get_byte();
                        let index = this.get_byte();
                        if (is_local) {
                            closure.upvalues[i] = this.captureUpvalue(this.stack[this.current().previous_stack_ptr + index]);
                        } else {
                            closure.upvalues[i] = this.current().cl?.upvalues[index]!
                        }
                    }
                    break;
                }

                case Opcode.POP: {
                    this.pop();
                    break;
                }
                case Opcode.CONSTANT: {
                    let val = this.get_word_arg()
                    if (this.debug) {
                        console.log("constant: " + pretty_print(val))
                    }
                    this.push(val)
                    break;
                }
                case Opcode.LINE: { //NOP
                    this.current().last_line = this.get_word();
                    continue;
                }
                case Opcode.NEGATE:
                    this.check_number();
                    this.push(- this.pop()!)
                    break;

                case Opcode.NOT:
                    this.push(!truthy(this.pop()!));
                    break;

                case Opcode.AND: {
                    let right = this.pop();
                    let left = this.pop();
                    if (!truthy(left!)) {
                        this.push(left!)
                    } else {
                        this.push(right!)
                    }
                    break;
                }

                case Opcode.OR: {
                    let right = this.pop();
                    let left = this.pop();
                    if (truthy(left!)) {
                        this.push(left!)
                    } else {
                        this.push(right!)
                    }
                    break;
                }

                case Opcode.EQUAL:
                    this.push(this.pop() === this.pop());
                    break;

                case Opcode.LESS:
                    this.check_number();
                    this.check_number(1);
                    this.push((this.pop() as number) < (this.pop() as number));
                    break;

                case Opcode.GREATER:
                    this.check_number();
                    this.check_number(1);
                    this.push((this.pop() as number) > (this.pop() as number));
                    break;

                case Opcode.ADD: {
                    if (typeof this.peek() === "number") {
                        this.check_number();
                        this.check_number(1);
                        this.push((this.pop() as number) + (this.pop() as number));
                        break;
                    } else if (typeof this.peek() === "string") {
                        this.check_string();
                        this.check_string(1);
                        this.push((this.pop() as string) + (this.pop() as string));
                        break;
                    } else {
                        throw new RuntimeError(`can't apply + to ${pretty_print(this.peek())}`, this.get_location())
                    }
                }
                case Opcode.SUBTRACT:
                    this.check_number();
                    this.check_number(1);
                    this.push((this.pop() as number) - (this.pop() as number));
                    break;

                case Opcode.MULTIPLY:
                    this.check_number();
                    this.check_number(1);
                    this.push((this.pop() as number) * (this.pop() as number));
                    break;

                case Opcode.DIVIDE:
                    this.check_number();
                    this.check_number(1);
                    this.push((this.pop() as number) / (this.pop() as number));
                    break;

                case Opcode.NIL:
                    this.push(null);
                    break;

                case Opcode.TRUE:
                    this.push(true);
                    break;

                case Opcode.FALSE:
                    this.push(false);
                    break;

                case Opcode.PRINT: {
                    let val = this.peek();
                    if (val === null) {
                        this.options.output.write("nil" + os.EOL)
                    } else {
                        this.options.output.write(val.toString() + os.EOL)
                    }
                    break;
                }

                case Opcode.DEF_GLOBAL: {
                    let id = this.get_word_arg()
                    let expr = this.peek();
                    this.symboltable.set(id as string, expr!)
                    if (this.options.trace) {
                        this.symboltable.dump();
                    }
                    break;
                }

                case Opcode.SET_GLOBAL: {
                    let id = this.get_word_arg()
                    let expr = this.peek();
                    if (this.symboltable.has(id as string)) {
                        this.symboltable.assign(id as string, expr!)
                        break;
                    }
                    throw new RuntimeError(`undefined variable ${id!.toString()}`, this.get_location())
                }

                case Opcode.GET_GLOBAL: {
                    let id = this.get_word_arg()
                    let val = this.symboltable.get(id as string);
                    if (val === undefined) {
                        throw new RuntimeError(`identifier ${id!.toString()} not found`, this.get_location());
                    }
                    this.push(val)
                    break;
                }

                case Opcode.DEF_LOCAL: {
                    let expr = this.peek();
                    this.push(expr)
                    break;
                }

                case Opcode.GET_UPVALUE: {
                    let slot = this.get_byte();
                    this.push(this.current().cl?.upvalues[slot]?.location as LoxValue);
                    break;
                }

                case Opcode.SET_UPVALUE: {
                    let slot = this.get_byte();
                    this.current().cl!.upvalues[slot].location = this.peek();
                    break;
                }

                case Opcode.SET_LOCAL: {
                    let id = this.get_word()
                    let expr = this.peek();
                    this.stack_set_location(id, expr);
                    break;
                }

                case Opcode.GET_LOCAL: {
                    let id = this.get_word();
                    this.push(this.stack_get_location(id))
                    break;
                }

                case Opcode.POP_LOCAL:
                    this.pop();
                    break;

                case Opcode.JMP_IF_FALSE: {
                    let offset = this.get_word();
                    let val = this.peek();
                    if (!truthy(val!)) {
                        this.current().ip += offset;
                    }
                    break;
                }

                case Opcode.JMP_IF_TRUE: {
                    let offset = this.get_word();
                    let val = this.peek();
                    if (truthy(val!)) {
                        this.current().ip += offset;
                    }
                    break;
                }

                case Opcode.JUMP: {
                    let offset = this.get_word();
                    this.current().ip += offset;
                    break;
                }

                case Opcode.CLASS: {
                    this.push(new LoxBClass(this.get_word_arg() as string))
                    break;
                }

                case Opcode.INHERIT: {
                    let sub_class = this.peek(1) as LoxBClass;
                    let super_class_name = this.peek() as string;
                    let super_class = this.symboltable.get(super_class_name)
                    if (super_class instanceof LoxBClass) {
                        // console.log(`superclass : ${super_class.name} method count ${super_class.methods.size}`)
                        super_class.methods.forEach(method => {
                            sub_class.methods.set(method.fn.fn.name.id, method)
                        })
                    } else {
                        throw new RuntimeError(`superclass of ${sub_class.name} must be a class`, this.get_location())
                    }
                    this.pop();
                    break;
                }

                case Opcode.METHOD: {
                    let method_name = this.get_word_arg() as string;
                    let cls = this.peek(1) as LoxBClass;
                    cls.methods.set(method_name, this.peek() as LoxClosure);
                    this.pop();
                    break;
                }

                case Opcode.GET_PROPERTY: {
                    if (!(this.peek() instanceof LoxBInstance)) {
                        throw new RuntimeError("only objects have properties", this.get_location())
                    }
                    let instance = this.pop() as LoxBInstance;
                    let field = this.get_word_arg() as string;

                    // Look for field
                    if ((instance as LoxBInstance).fields.has(field)) {
                        this.push(instance.fields.get(field)!)
                        break;
                    }

                    // Look for method
                    if (instance.cls.methods.has(field)) {
                        let bound = new LoxBoundMethod(instance, instance.cls.methods.get(field)!)
                        this.push(bound);
                        break;
                    }

                    throw new RuntimeError(`undefined property ${field}`, this.get_location())
                }

                case Opcode.SET_PROPERTY: {
                    if (!(this.peek() instanceof LoxBInstance)) {
                        throw new RuntimeError("only objects have properties", this.get_location())
                    }
                    let instance = this.pop() as LoxBInstance;
                    let field = this.get_word_arg();
                    let value = this.pop();
                    this.pop();
                    instance.fields.set(field as string, value!)
                    this.push(value!);
                    break;
                }

                default:
                    throw new RuntimeError("implementation: unknown instruction " + instr, this.get_location())
            }
            if (this.debug) {
                this.dump_stack();
            }
        }
    }

    invoke_method(receiver: LoxBInstance, method: LoxClosure, arity: number) {
        let pos = this.stack.length - arity - 1;
        //console.log(`this is ${cl.receiver} pos = ${pos}`)
        this.stack[pos] = receiver;
        this.call(method, arity)
    }

    call(cl: LoxClosure, arity: number): void {
        var new_frame = new Frame(this.stack_length(), cl.fn.bytecodes, this.stack_length());
        new_frame.arity = arity;
        new_frame.frame_ptr = this.stack.length - arity - (cl.fn.is_method() ? 1 : 0)
        new_frame.cl = cl;
        this.frame_stack.push(new_frame);
        // execute function
        return;
    }

    captureUpvalue(local: LoxValue) {
        return new LoxUpvalue(local);
    }

    dump_symboltable() {
        this.symboltable.dump();
    }

    dump_stack() {
        let buf = "";
        this.stack.forEach((v) => {
            buf += ` ${pretty_print(v)} | `
        })
        console.log("stack:" + buf);
    }

    dump_frame() {
        console.log("Frames:")
        for (let frame of this.frame_stack) {
            console.log(`    line ${frame.last_line} in ${frame.cl?.fn ?? '_main'}`)
        }
    }
}



