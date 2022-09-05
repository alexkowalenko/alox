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

```BNF
expression     -> literal | unary | binary | grouping ;
unary          -> ("-" | "!") expression;
binary         -> expression operator expression ;
grouping       -> "(" expression ")" ;
operator       -> "==" | "!=" | "<" | "<=" | ">" | ">=" | "+"  | "-"  | "*" | "/" | "or" | "and" ;
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
