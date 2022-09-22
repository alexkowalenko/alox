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
import { pretty_print } from './src/runtime';


function send_output(file: string, opts: Options) {
    let output = fs.createWriteStream(file, { encoding: "utf8" })
    opts.output = output;
}

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
                console.log(`: ${pretty_print(val)}`)
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
        fs.writeFileSync('.alox', histories.join('\n').trimEnd())
    })

    rl.on('SIGINT', (line: string) => {
        console.log('Interupt!');
        process.exit(0);
    })

    rl.on('close', () => {
        console.log('Bye!');
        process.exit(0);
    });
}

async function do_file(file: string, opts: Options) {
    opts.input = fs.createReadStream(file, { encoding: "utf8" });
    const interpreter = new Interpreter(opts);
    try {
        let val = await interpreter.do_stream();
        if (!opts.silent) {
            console.log(`: ${pretty_print(val)}`)
        }
    }
    catch (e) {
        console.error((e as Error).toString())
    }
}

(async function run() {
    program.name('ALOX 👾 interpreter')
        .description("The ALOX programming language")
        .version("0.1.0")

    program.option('-s, --silent', 'turn off extra output')
    program.option('-f, --file <file>', 'execute <file>')
    program.option('-o, --output <file>', 'send output to <file>')
    program.option('-p, --parse', 'print out the parsed script')
    program.option('-t, --timer', 'print out timings')
    program.option('-b, --bytecode', 'use the bytecode compiler')

    program.parse(process.argv);

    const options = program.opts();
    let opts = new Options();
    opts.silent = options.silent;
    opts.parse = options.parse;
    opts.timer = options.timer;
    opts.bytecode = options.bytecode;
    if (!options.silent) {
        console.log("ALOX 👾 interpreter")
        if (opts.bytecode) {
            console.log("     👾 byte1;code engine")
        }
    }

    if (options.output) {
        send_output(options.output, opts)
    }

    if (options.file) {
        await do_file(options.file, opts)
    } else {
        do_interactive(opts)
    }
})();