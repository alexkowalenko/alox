#!env ts-node
//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import * as fs from "fs";
import child_process from "child_process"

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

for (const name of find_files(base_dir, ".lox")) {
    test(name, () => {
        const file = `${base_dir}/${name}`;
        const content = fs.readFileSync(file, { encoding: "utf8" });

        console.log(`file ${file}`)
        let expectedOutput = new Array<String>();
        let errorOutput = new Array<String>();

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

        // Execute ALOX program and capture output
        const cmd = `${exec_file} -s -f ${file}`
        // console.log(cmd)
        const args = cmd.split(' ');
        const result = child_process.spawnSync(args[0], args.slice(1), { encoding: "utf8" })
        const output = result.stdout
        //console.log(output)
        //console.log(result.stderr)

        let realOutput = output.split('\n')
        for (let i = 0; i < realOutput.length && i < expectedOutput.length; i++) {
            expect(expectedOutput[i]).toBe(realOutput[i])
        }
        if (result.status != 0) {
            let realError = result.stderr.split('\n');
            for (let i = 0; i < errorOutput.length && i < errorOutput.length; i++) {
                expect(errorOutput[i]).toBe(realError[i])
            }
        }
    })
}