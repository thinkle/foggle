import { describe, expect, it } from 'vitest';
import { getGuessConflicts } from './hardMode';
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
