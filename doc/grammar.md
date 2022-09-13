# Grammar for ALOX

## Lexical Items

```EBNF
NUMBER      -> DIGIT+ ('.' DIGIT*)? ;
STRING      -> '"' <any character except "> '"' ;
IDENTIFIER  -> ALPHA (ALPHA | <Unicode Digit Char>)* ;
ALPHA       -> <Unicode Letter Char> | <Emoji Character> | '_' ;
DIGIT       -> '0' ... '9' ;
```

Comments are introduced with `//` and continue to the end of the line.

## Grammar

This is the grammar which is implemented:

```EBNF
program        → declaration* EOF ;

declaration    -> varDecl
               | statement ;

varDecl     -> "var" IDENTIFIER ("=" expression)? ";" ;

statement   → exprStmt
            | ifStmt 
            | whileStmt
            | forStmt
            | printStmt 
            | breakStmt
            | block;

exprStmt    → expression ";" ;
ifStmt      -> 'if' '(' expression ')' statement ('else' statement)? ;
whileStmt   -> 'while' '(' expression ')' statement ;
forStmt     -> 'for' '(' (varDecl | statement)? ';' (expression)? ';' (expression)? ')' statement ;
printStmt   → "print" expression ";" ;
breakStmt   -> "break" | "continue";
block       -> "{" declaration* "}" ;

expression     -> primary | unary | binary | grouping ;
unary          -> ("-" | "!") unary | call;
call           -> primary ( "(" arguments ")" )* ;
arguments      -> expression ( "," expression )* ;
binary         -> expression operator expression ;
grouping       -> "(" expression ")" ;
operator       -> "==" | "!=" | "<" | "<=" | ">" | ">=" | "+"  | "-"  | "*" | "/" | "or" | "and" | "=" ;
primary        -> IDENTIFIER | literal
literal        -> NUMBER | STRING | "true" | "false" | "nil" ;
```

## Operator Precedence

1. 'or'
2. 'and'
3. "==" | "!=" | "<" | "<=" | ">" | ">="
4. "+" | "-"
5. "*" | "/"
6. "-" | "!" unary
7. exponent
