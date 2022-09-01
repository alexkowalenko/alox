//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { Token } from '../src/token'

describe('Token test', () => {
    it('Tokens', () => {
        expect("" + Token.AND).toBe("and");
    });
});