#!env ts-node
//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import * as fs from "fs";
import child_process from "child_process"
import * as stream from 'stream'
import { finished } from 'node:stream/promises';

import { Interpreter, Options } from "../src/interpreter";
import { LoxValue } from "../src/runtime";

const base_dir = "./xtest"
const ts_node = "node_modules/ts-node/dist/bin.js"
const prog_file = "alox.ts"
const exec_file = `${ts_node} ${prog_file}`

function find_files(dirPath: string, suffix: string): string[] {
    const dirEntries = fs.readdirSync(dirPath, { withFileTypes: true });

    return dirEntries.flatMap((dirEntry) => {
        if (dirEntry.isFile() && dirEntry.name.endsWith(suffix)) {
            return [dirEntry.name];
        } else if (dirEntry.isDirectory()) {
            return (
                find_files(`${dirPath}/${dirEntry.name}`, suffix)
                    .map(fileName => `${dirEntry.name}/${fileName}`)
            );
        }
        return [];
    });
}

const expectPattern = /\/\/ expect: (?<expect>.*)/
const errorPattern = /\/\/ error: (?<expect>.*)/

function get_expected(name: string): [Array<string>, Array<string>] {
    const file = `${base_dir}/${name}`;
    const content = fs.readFileSync(file, { encoding: "utf8" });

    console.log(`file ${file}`)
    let expectedOutput = new Array<string>();
    let errorOutput = new Array<string>();

    for (const line of content.split("\n")) {
        let matcher = line.match(expectPattern)
        if (matcher) {
            let ex = matcher?.groups?.expect
            //console.log(`expect: ${ex}`)
            expectedOutput.push(ex!)
        }
        matcher = line.match(errorPattern)
        if (matcher) {
            let ex = matcher?.groups?.expect
            // console.log(`error: ${ex}`)
            errorOutput.push(ex!)
        }
    }
    return [expectedOutput, errorOutput];
}

function execute_test(name: string): [number, string[], string[]] {
    // Execute ALOX program and capture output
    const file = `${base_dir}/${name}`;
    const cmd = `${exec_file} -s -f ${file}`
    // console.log(cmd)
    const args = cmd.split(' ');
    const result = child_process.spawnSync(args[0], args.slice(1))

    let realOutput = result.stdout.toString().split('\n');
    let realError = result.stderr.toString().split('\n');
    return [result.status ?? 0, realOutput, realError]
}

async function execute_test_interp(name: string): Promise<[number, string[], string[]]> {
    let options = new Options;
    options.silent = true;

    const file = `${base_dir}/${name}`;
    options.input = fs.createReadStream(file, { encoding: "utf8" })
    options.output = new stream.PassThrough;
    options.error = new stream.PassThrough;
    let status = 0;
    let val: LoxValue = null;

    const interpreter = new Interpreter(options);
    try {
        val = await interpreter.do_stream();
        finished(options.output)
    }
    catch (e) {
        console.log((e as Error).toString())
        status = -1;
    }

    let realOutput: string[] = [];
    options.output.on('data', (data: string) => {
        realOutput = data.toString().split('\n');
    });
    let realError = options.error.toString().split('\n');
    return [status, realOutput, realError]
}

async function run_test(name: string) {
    test(name, async () => {
        let [expectedOutput, errorOutput] = get_expected(name);
        let [status, realOutput, realError] = execute_test(name);
        // let [status, realOutput, realError] = await execute_test_interp(name);

        for (let i = 0; i < realOutput.length && i < expectedOutput.length; i++) {
            expect(realOutput[i]).toBe(expectedOutput[i]);
        }
        if (status != 0) {
            for (let i = 0; i < errorOutput.length && i < errorOutput.length; i++) {
                expect(realError[i]).toBe(errorOutput[i])
            }
        }
    });
}

async function run_tests() {
    for (const name of find_files(base_dir, ".lox")) {
        run_test(name)
    }
}

run_tests()