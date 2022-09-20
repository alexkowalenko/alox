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
                | funDecl
                | classDecl
                | statement ;

varDecl     -> "var" IDENTIFIER ("=" expression)? ";" ;
funDecl     -> "fun" function ;
function    -> IDENTIFIER "(" parameters? ")" block ;
parameters  -> IDENTIFIER ( "," IDENTIFIER )* ;
classDecl   -> "class" IDENTIFIER "{" function* "}" ; 

statement   → exprStmt
            | ifStmt 
            | whileStmt
            | forStmt
            | printStmt 
            | breakStmt
            | returnStmt
            | block ;

exprStmt    → expression ";" ;
ifStmt      -> 'if' '(' expression ')' statement ('else' statement)? ;
whileStmt   -> 'while' '(' expression ')' statement ;
forStmt     -> 'for' '(' (varDecl | statement)? ';' (expression)? ';' (expression)? ')' statement ;
printStmt   → "print" expression ";" ;
breakStmt   -> "break" | "continue";
returnStmt  -> "return" (expression)?
block       -> "{" declaration* "}" ;

expression     -> primary | unary | binary | assignment | grouping ;
unary          -> ("-" | "!") unary | call | lambda
call           -> primary ( "(" arguments ")" | "." IDENTIFIER )* ;
lambda         -> "fun" "(" parameters? ")" block ;
arguments      -> expression ( "," expression )* ;
binary         -> expression operator expression ;
assignment     -> (call ".")? IDENTIFIER "=" assignment;
grouping       -> "(" expression ")" ;
operator       -> "==" | "!=" | "<" | "<=" | ">" | ">=" | "+"  | "-"  | "*" | "/" | "or" | "and" | "=" ;
primary        -> IDENTIFIER | literal | "this"
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
