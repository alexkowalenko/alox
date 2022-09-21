# ALOX

ALOX - A Lox implementation in Typescript. Following (not exactly) the book [_Crafting Interpreters_](http://www.craftinginterpreters.com/) by Robert Nystrom.

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
