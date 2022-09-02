//
// ALOX interpreter
//
// Copyright © Alex Kowalenko 2022.
//

import { TokenType } from '../src/token'

describe('Token test', () => {
    it('Tokens', () => {
        expect("" + TokenType.AND).toBe("and");
    });
});