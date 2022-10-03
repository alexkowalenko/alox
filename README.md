# ALOX

ALOX - A Lox implementation in Typescript. Following (not exactly) the book [_Crafting Interpreters_](http://www.craftinginterpreters.com/) by Robert Nystrom.

Run the REPL by invoking `alox.ts`.

## Progress

- [x] Lexer - Chapter 4: Scanning.
- [x] AST - Chapter 5: Representing Code.
- [x] A REPL.
- [x] Parser - Expressions - Chapter 6: Parsing Expressions. Implemented using Prat Operator precedence parser (§17.6).
- [x] Interpreter - Chapter 7: Evaluating Expressions.
- [x] Assignment, Program structure - Chapter 8: State and Statements
  - [x] Program structure, `print`.
  - [x] Variables, environment, assignment.
  - [x] Blocks (§8.5 Scope)
- [x] Test Structure for running test programs.
- [x] Control flow - Chapter 9.
  - [x] `if` statements, logical operators partial evaluation
  - [x] `while` statement.
  - [x] `for` statement.
  - [x] `break` and `continue`.
- [x] Functions - Chapter 10.
  - [x] Function calls - parsing
  - [x] Native Functions
  - [x] Function declarations
  - [x] `return` statement.
  - [x] Simple lexical closures
  - [x] Lambda expressions `fun(){}`
- [x] Full closures - Chapter 11 - Resolution and Binding
- [x] Classes - Chapter 12.
  - [x] Definitions `class`
  - [x] Creation
  - [x] Properties
  - [x] Methods
  - [x] `this`
  - [x] Constructors
- [x] Inheritance - Chapter 13.
  - [x] Super classes
  - [x] Inheriting methods
  - [x] Calling superclass methods
- [ ] Extras
  - [ ] `getc()`, `chr()`, `ord()`.

## Part II Bytecode compiler

- [x] Chunk - Chapter 14 - Bytecode.
- [x] VM - Chapter 15 - Virtual Machine.
  - [x] Structure for VM.
  - [x] Stack
  - [x] Arithmetic operators.
- [x] Lexical Scanner - Chapter 16 = Reuse lexer, parser, and analyser.
- [x] Compiling expressions - Chapter 17.
  - [x] Emitting Bytecode and running bytecode..
- [x] Runtime type checking - Chapter 18 Types of Values.
  - [x] Arithmetic operations.
  - [x] Relational and Not operations.
- [x] Strings - Chapter 19.
- [x] Hash Tables - Chapter 20. Implemented in TypeScript/JavaScript.
- [x] Global Variables - Chapter 21.
  - [x] `print` & POP
  - [x] Define global variables
  - [x] Access global variables
- [x] Test structure for running files with bytecode engine.
- [x] Local Variables - Chapter 22.
  - [x] Block scopes
  - [x] Define local variables
  - [x] Access local variables
  - [x] Set local variables
- [x] Control Statements - Chapter 23.
  - [x] `if` statement.
  - [x] logical operators `and`, `or`.
  - [x] `while` statement.
  - [x] `for` statement.
  - [x] `continue` and `break`.
- [x] Functions - Chapter 24.
  - [x] Function context for compiler, frames for the vm.
  - [x] Call functions with no arguments.
  - [x] Argument passing.
  - [x] Lambda expressions.
  - [x] Native Functions.
- [ ] Closures - Chapter 25.
  - [x] Wrap functions in closure structure.
  - [x] Upvalues
  - [ ] Closed upvalues
- [x] Garbage Collection - Chapter 26. Implemented in TypeScript/JavaScript.
- [x] Classes and Instances - Chapter 27.
  - [x] Class objects
  - [x] Instances
- [x] Methods and Initializers - Chapter 28.
  - [x] Methods.
  - [x] `this`
  - [x] Constructors.
- [ ] Superclasses - Chapters 29.
  - [x] Inheritance.
  - [ ] `super`.

## Problems

- Differing from the book, every statement returns a value. This led to some messy code to keep stack hygiene in block statements, and also returning from constructors. This was done so that the compiler could be tested via what it returned. If I re-write this interpreter/compiler, I will eliminate this feature and keep it closer to book.

- TypeScript/JavaScript does not really allow to point to values into the stack, like the C version did. I could have worked it out via a index into the array of the stack, but it is too messy. Thus closures don't work.

- Line numbers are transferred to the VM via special Opcode LINE - I think this does slow down significantly the VM, as you can't really turn of line numbers due to error code reporting. Line number information should be kept separately in the bytecode chunk, but not fed through the VM.
  