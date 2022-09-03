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
expression     -> NUMBER
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

1. 'and' | 'or'
2. "==" | "!="
3. "<" | "<=" | ">" | ">="
4. "-" | "!" uniary
5. "*" | "/"
6. "+" | "-"
