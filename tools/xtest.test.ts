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
const exec_file = `${ts_node} interp.ts`

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

const expectedOutputPattern = /\/\/ expect: (?<expect>.*)/

for (const name of find_files(base_dir, ".lox")) {
    test(name, () => {
        const file = `${base_dir}/${name}`;
        const content = fs.readFileSync(file, { encoding: "utf8" });

        //console.log(`file ${file}`)
        let expectedOutput = new Array<String>();

        for (const line of content.split("\n")) {
            let matcher = line.match(expectedOutputPattern)
            if (matcher) {
                let ex = matcher?.groups?.expect
                // console.log(`expect: ${ex}`)
                expectedOutput.push(ex!)
            }
        }

        // Execute ALOX program and capture output
        const cmd = `${exec_file} -s -f ${file}`
        console.log(cmd)
        const output = child_process.execSync(cmd)
        console.log(output.toString())

        let realOutput = output.toString().split('\n')
        for (let i = 0; i < realOutput.length && i < expectedOutput.length; i++) {
            expect(expectedOutput[i]).toBe(realOutput[i])
        }
    })
}