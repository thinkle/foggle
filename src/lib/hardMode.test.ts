import { describe, expect, it } from 'vitest';
import { getGuessConflict } from './hardMode';
import { computeWordFeedback } from './wordFeedback';

function check(candidate: string, history: string[], answer: string) {
	return getGuessConflict(
		candidate,
		history,
		history.map((guess) => computeWordFeedback(guess, answer).word)
	);
}

describe('hard mode', () => {
	it('explains when a non-green letter would turn green from the right', () => {
		expect(check('zztzzzzzz', ['atxxxxxx'], 'zzzzt')).toEqual({
			row: 0,
			tile: 1,
			reason: 'T can’t be in position 7 from the right.'
		});
	});

	it('keeps a right-side match when the guess length changes', () => {
		expect(check('square', ['apple'], 'orange')).toBeNull();
		expect(check('squary', ['apple'], 'orange')?.reason).toBe('E must be the last letter.');
	});

	it('reports a conflict from a later row', () => {
		expect(check('square', ['apple', 'origin'], 'orange')?.row).toBe(1);
	});

	it('explains extra copies when the same letter was already matched elsewhere', () => {
		expect(check('abxabcd', ['aax'], 'abxb')?.reason).toBe(
			'This guess leaves too many unmatched copies of A.'
		);
	});

	it('accepts a first guess and the answer itself', () => {
		expect(check('apple', [], 'orange')).toBeNull();
		expect(check('orange', ['apple', 'origin'], 'orange')).toBeNull();
	});
});
