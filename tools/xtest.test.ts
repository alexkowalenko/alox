#!env ts-node
//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import * as fs from "fs";
import { spawn } from "child_process";

const base_dir = "./xtest"
const ts_node = "node_modules/ts-node/dist/bin.js"
const prog_file = "alox.ts"
const exec_file = `${ts_node} ${prog_file}`

type SpawnResult = {
    stderr: string,
    stdout: string,
    status: number,
}

const spawnP = (
    cmd: string,
    args: ReadonlyArray<string>,
) => new Promise((resolve, reject) => {
    const cp = spawn(cmd, args);
    let result: SpawnResult = {
        stderr: "",
        stdout: "",
        status: 0
    };
    cp.stdout.on('data', (data) => {
        result.stdout += data.toString();
    });

    cp.stderr.on('data', (data) => {
        result.stderr += data.toString();
    });

    cp.on('exit', (code) => {
        result.status = code ?? 0;
    });

    cp.on('close', () => {
        resolve(result);
    });
});

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

class FileInfo {
    constructor(public output: Array<string>, public errors: Array<string>) {
        this.options = new Array;
    }
    public options: Array<string>;
    public status = 0;
}

const expectPattern = /\/\/ expect: (?<expect>.*)/
const errorPattern = /\/\/ error: (?<expect>.*)/
const optionPattern = /\/\/ option: (?<expect>.*)/

function get_expected(name: string): FileInfo {
    const file = `${base_dir}/${name}`;
    const content = fs.readFileSync(file, { encoding: "utf8" });

    let fi = new FileInfo(new Array<string>(), new Array<string>());
    for (const line of content.split("\n")) {
        let matcher = line.match(expectPattern)
        if (matcher) {
            let ex = matcher?.groups?.expect
            //console.log(`expect: ${ex}`)
            fi.output.push(ex!)
        }
        matcher = line.match(errorPattern)
        if (matcher) {
            let ex = matcher?.groups?.expect
            //console.log(`error: ${ex}`)
            fi.errors.push(ex!)
        }
        matcher = line.match(optionPattern)
        if (matcher) {
            let ex = matcher?.groups?.expect
            // console.log(`option : ${ex}`)
            fi.options.push(ex!)
        }
    }
    return fi;
}

async function execute_test(name: string): Promise<FileInfo> {
    // Execute ALOX program and capture output

    const file = `${base_dir}/${name}`;
    console.log(`do ${file}`)
    const cmd = `${exec_file} -s -f ${file}`
    const args = cmd.split(' ');
    let { stdout, stderr, status } = await spawnP(args[0], args.slice(1)) as SpawnResult;
    // console.log("error: " + stderr)
    let test_result = new FileInfo(stdout.split('\n'), stderr.split('\n'));
    test_result.status = status
    return test_result;
}

async function run_test(name: string) {
    let file_expected = get_expected(name);
    test(name, async () => {
        let test_result = await execute_test(name);

        for (let i = 0; i < file_expected.output.length && i < test_result.output.length; i++) {
            expect(test_result.output[i]).toBe(file_expected.output[i]);
        }
        if (test_result.status != 0) {
            for (let i = 0; i < file_expected.errors.length && i < test_result.errors.length; i++) {
                expect(test_result.errors[i]).toBe(file_expected.errors[i]);
            }
        }
    });
}

function run_tests() {
    let files = find_files(base_dir, ".lox");
    let promises = [];
    for (let file of files) {
        promises.push(run_test(file))
    }
    Promise.allSettled(promises).then(() => {
        console.log("finished tests")
    })
}

run_tests()