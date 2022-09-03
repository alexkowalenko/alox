# Grammar for ALOX

## Lexical Items

```BNF
NUMBER      -> DIGIT+ ('.' DIGIT*) ;
STRING      -> '"' <any character except "> '"' ;
IDENTIFIER  -> ALPHA (ALPHA | <Unicode Digit Char>)* ;
ALPHA       -> <Unicode Letter Char> | <Emoji Character> | '_' ;
DIGIT       -> '0' ... '9' ;
```

## Grammar

This is the grammar which is implemented:

```
expression      -> literal
literal         -> NUMBER | "true" | "false" | "nil" ;
```

This is the grammar which we are aiming at:

```BNF
expression     -> literal
               | unary
               | binary
               | grouping ;

literal        -> NUMBER | STRING | "true" | "false" | "nil" ;
grouping       -> "(" expression ")" ;
unary          -> ( "-" | "!" ) expression ;
binary         -> expression operator expression ;
operator       -> "==" | "!=" | "<" | "<=" | ">" | ">=" | "+"  | "-"  | "*" | "/" ;
```

## Operator Precedence

1. 'or'
2. 'and'
3. "==" | "!=" | "<" | "<=" | ">" | ">="
4. "+" | "-"
5. "*" | "/"
6. "-" | "!" unary
7. exponent
