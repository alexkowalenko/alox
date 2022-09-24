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
- [ ] Test structure for running files with bytecode engine.
- [ ] Local Variables - Chapter 22.
  - [x] Block scopes
  - [x] Define local variables
  - [x] Access local variables
  - [ ] Set local variables
- [ ] Control Statements - Chapter 23.
  - [ ] `if` statement.
  - [ ] logical operators `and`, `or`.
  - [ ] `while` statement.
  - [ ] `for` statement.
