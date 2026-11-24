import { describe, expect, it } from 'vitest';
import { getGuessConflicts, playedWholeGameHard } from './hardMode';
import { computeWordFeedback } from './wordFeedback';

function check(candidate: string, history: string[], answer: string) {
	return getGuessConflicts(
		candidate,
		history,
		history.map((guess) => computeWordFeedback(guess, answer).word)
	);
}

describe('hard mode', () => {
	it('marks a letter that would become green from the right', () => {
		expect(check('zztzzzzzz', ['atxxxxxx'], 'zzzzt')).toEqual({
			rules: [
				{ kind: 'bans', mark: 'ban-right', label: 'T 7th from the right', plain: false }
			],
			tiles: [[[], ['ban-right'], [], [], [], [], [], []]]
		});
	});

	it('collects conflicts across tiles and rows and lists each rule once', () => {
		const result = check('scary', ['apple', 'origin', 'plea'], 'orange');
		expect(result?.rules.map(({ label }) => label)).toEqual(
			expect.arrayContaining(['E 1st from the right', 'O 1st from the left', 'N', 'E'])
		);
		expect(result?.rules.filter(({ label }) => label === 'E')).toHaveLength(1);
		expect(result?.tiles[0][4]).toContain('need-right');
		expect(result?.tiles[1][0]).toContain('need-left');
		expect(result?.tiles[2][2]).toContain('present');
	});

	it('marks both sides when a single tile breaks two rules', () => {
		const result = check('xaz', ['ab'], 'axz');
		expect(result?.tiles[0][0]).toEqual(['need-left', 'ban-right']);
	});

	it('groups a forbidden letter once and marks every source tile', () => {
		const result = check('apex', ['apple', 'paper'], 'orange');
		expect(result?.rules.filter(({ label }) => label === 'P')).toEqual([
			{ kind: 'bans', mark: 'absent', label: 'P', plain: true }
		]);
		expect(result?.tiles[0].slice(1, 3)).toEqual([['absent'], ['absent']]);
		expect(result?.tiles[1][0]).toEqual(['absent']);
	});

	it('explains an extra unmatched copy of a letter already matched elsewhere', () => {
		expect(check('abxabcd', ['aax'], 'abxb')?.rules.map(({ label }) => label)).toContain(
			'Extra unmatched copies of A'
		);
	});

	it('accepts a first guess, a consistent guess of a different length, and the answer', () => {
		expect(check('apple', [], 'orange')).toBeNull();
		expect(check('square', ['apple'], 'orange')).toBeNull();
		expect(check('orange', ['apple', 'origin'], 'orange')).toBeNull();
	});

	it('accepts exactly the candidates that reproduce the earlier clues', () => {
		const words = ['a', 'b'];
		for (let i = 0; i < 6; i++) words.push(words[i] + 'a', words[i] + 'b');
		for (const guess of words) {
			const feedback = words.map((word) => computeWordFeedback(guess, word).word);
			for (const [i, expected] of feedback.entries()) {
				for (const [j, actual] of feedback.entries()) {
					const matches = expected.every((clue, index) => clue === actual[index]);
					if ((getGuessConflicts(words[j], [guess], [expected]) === null) !== matches) {
						throw new Error(`Wrong result for ${guess}, ${words[i]}, ${words[j]}`);
					}
				}
			}
		}
	});
});

describe('playedWholeGameHard', () => {
	it('is true for a game with no guesses yet', () => {
		expect(playedWholeGameHard([], 'orange')).toBe(true);
	});

	it('is true when every guess respects the clues so far', () => {
		// Each guess is checked against the clues from the ones before it.
		const guesses = ['scary', 'orange'];
		expect(check(guesses[1], [guesses[0]], 'orange')).toBe(null);
		expect(playedWholeGameHard(guesses, 'orange')).toBe(true);
	});

	it('is false when any guess ignores a clue', () => {
		// 'apple' tells you the answer has no P; 'paper' uses one anyway.
		expect(check('paper', ['apple'], 'orange')).not.toBe(null);
		expect(playedWholeGameHard(['apple', 'paper', 'orange'], 'orange')).toBe(false);
	});

	it('earns the asterisk for a legal game that started from a bad guess', () => {
		// 'apple' shares almost nothing with the answer, but a first guess can't
		// break a rule, and the follow-up respects every clue it gave.
		expect(playedWholeGameHard(['apple', 'orange'], 'orange')).toBe(true);
	});

	it('stays false once a rule is broken, however the game ends', () => {
		expect(playedWholeGameHard(['apple', 'paper', 'scary', 'orange'], 'orange')).toBe(false);
	});

	it('only judges a guess against the clues available when it was made', () => {
		// 'apple' is the first guess, so it cannot break a rule, even though
		// later clues rule it out.
		expect(playedWholeGameHard(['apple'], 'orange')).toBe(true);
	});

	it('is false with no answer to check against', () => {
		expect(playedWholeGameHard(['apple'], '')).toBe(false);
	});
});
