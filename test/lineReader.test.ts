//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { LineReader } from '../src/lineReader'

describe('LineReader', () => {
    it('basic', () => {
        let line = new LineReader("123456");
        expect(line.get_char()).toBe("1");
        expect(line.get_char()).toBe("2");
        expect(line.get_char()).toBe("3");
        expect(line.get_char()).toBe("4");
        expect(line.get_char()).toBe("5");
        expect(line.get_char()).toBe("6");
        expect(line.get_char()).toBe("");
    });

    it('basic 2', () => {
        let line = new LineReader("123456");
        expect(line.get_char()).toBe("1");
        expect(line.get_char()).toBe("2");
        expect(line.peek_char()).toBe("3");
    });

    it('basic3', () => {
        let line = new LineReader("123456");
        expect(line.get_char()).toBe("1");
        expect(line.get_char()).toBe("2");
        expect(line.get_char()).toBe("3");
        expect(line.get_char()).toBe("4");
        expect(line.get_char()).toBe("5");
        expect(line.get_char()).toBe("6");
        expect(line.peek_char()).toBe("");
    });

    it('location', () => {
        let line = new LineReader("123456");
        expect(line.get_location().pos).toBe(1);
        expect(line.get_char()).toBe("1");
        expect(line.get_char()).toBe("2");
        expect(line.get_location().pos).toBe(3);
        expect(line.get_location().line).toBe(1);
    });

    it('unicode', () => {
        let line = new LineReader("12👾456");
        expect(line.get_char()).toBe("1");
        expect(line.get_char()).toBe("2");
        expect(line.get_char()).toBe("👾");
        expect(line.get_char()).toBe("4");
        expect(line.get_char()).toBe("5");
        expect(line.get_char()).toBe("6");
        expect(line.get_location().pos).toBe(7);
    });

    it('filter', () => {
        var line = new LineReader("12 👾 456");
        expect(line.get_char_filter()).toBe("1");
        expect(line.get_char_filter()).toBe("2");
        expect(line.get_char_filter()).toBe("👾");
        expect(line.get_char_filter()).toBe("4");
        expect(line.get_char_filter()).toBe("5");
        expect(line.get_char_filter()).toBe("6");
        expect(line.get_location().pos).toBe(9);
    });

    it('end', () => {
        let line = new LineReader("1");
        expect(line.get_char_filter()).toBe("1");
        expect(line.peek_char()).toBe("");
    });

    it('comments', () => {
        let line = new LineReader("// hello \n1"); //
        expect(line.get_char_filter()).toBe("1");
        expect(line.peek_char()).toBe("");
    });


});