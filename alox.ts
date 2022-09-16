#!env ts-node
//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import readline from 'node:readline'
import fs from 'node:fs'
import { program } from 'commander'

import { LoxError } from './src/error';
import { Interpreter, Options } from './src/interpreter'


function do_interactive(opts: Options) {

    // Read history file
    const data = fs.readFileSync('.alox').toString()
    const histories = data.split('\n')
    // console.log(`Read histories: ${histories.length}`)

    let readline_opts = {
        input: process.stdin,
        output: process.stdout,
        historySize: 1000,
        prompt: "",
        removeHistoryDuplicates: true,
        history: histories,
    };
    if (!opts.silent) {
        readline_opts.prompt = "->"
    }

    const rl = readline.createInterface(readline_opts);
    const interpreter = new Interpreter(opts);

    rl.prompt();

    rl.on('line', (line: string) => {

        try {
            let val = interpreter.do(line);
            if (!opts.silent) {
                console.log(`: ${interpreter.pretty_print(val)}`)
            }
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

    rl.on('SIGINT', (line: string) => {
        console.log('Interupt!');
        process.exit(0);
    })

    rl.on('close', () => {
        fs.writeFileSync('.alox', histories.join('\n').trimEnd())
        console.log('Bye!');
        process.exit(0);
    });
}

function do_file(file: string, opts: Options) {
    let content = fs.readFileSync(file, { encoding: "utf8" })
    const interpreter = new Interpreter(opts);
    try {
        let val = interpreter.do(content);
        if (!opts.silent) {
            console.log(`: ${interpreter.pretty_print(val)}`)
        }
    }
    catch (e) {
        if (e instanceof LoxError) {
            if (opts.silent) {
                console.error(e.message)
            } else {
                console.error(e.toString())
            }
            process.exit(-1)
        } else {
            throw e
        }
    }
}

(function run() {
    program.name('ALOX 👾 interpreter')
        .description("The ALOX programming language")
        .version("0.1.0")

    program.option('-s, --silent', 'turn off extra output')
    program.option('-f, --file <file>', 'execute <file>')
    program.option('-p, --parseonly', 'only parse the script')

    program.parse(process.argv);

    const options = program.opts();
    let opts = new Options();
    opts.silent = options.silent;
    opts.parseOnly = options.parseonly;
    if (!options.silent) {
        console.log("ALOX 👾 interpreter")
    }

    if (options.file) {
        do_file(options.file, opts)
    } else {
        do_interactive(opts)
    }
})();