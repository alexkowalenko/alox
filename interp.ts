#!env ts-node
//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import readline from 'node:readline'
import fs from 'node:fs'

import { LoxError } from './src/error';

import { Lexer } from './src/lexer'
import { Parser } from './src/parser'
import { Printer } from './src/printer';

(function run() {
    console.log("ALOX 👾 interpreter")

    // Read history file

    const data = fs.readFileSync('.alox').toString()
    const histories = data.split('\n')
    // console.log(`Read histories: ${histories.length}`)

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '-> ',
        historySize: 1000,
        removeHistoryDuplicates: true,
        history: histories,
    });

    rl.prompt();

    rl.on('line', (line: string) => {
        const lexer = new Lexer(line);
        const parser = new Parser(lexer);

        try {
            const expr = parser.parse()
            const printer: Printer = new Printer();
            console.log(printer.print(expr))
        }
        catch (e) {
            if (e instanceof LoxError) {
                console.log(e.toString())
            } else {
                throw e
            }
        }
        rl.prompt()
    })

    rl.on('history', (line: string) => {
        histories.push(line)
    })

    rl.on('close', () => {
        fs.writeFileSync('.alox', histories.join('\n').trimEnd())
        console.log('Bye!');
        process.exit(0);
    });

})();