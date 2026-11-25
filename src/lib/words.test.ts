import { describe, it, expect } from 'vitest';
import { getAnswerWords, isValid } from './words';
import { decodeClue } from './encoder';

describe('clues are real', () => {
	it('Every word in the answer list should decode into a valid word', () => {
		const words = getAnswerWords();
		for (let i = 0; i < words.length; i++) {
			const word = words[i];
			expect(isValid(word), `Decoded clue ${word} #${i} is not a valid word`).toBe(true);
		}
	});
});

describe('getAnswerWords', () => {
	it('should provide unique list of words', () => {
		const words = getAnswerWords();
		const uniqueWords = Array.from(new Set(words));
		if (uniqueWords.length !== words.length) {
			// we have dups, let's find them...
			const duplicates: { [key: string]: number[] } = {};
			const seen: { [key: string]: boolean } = {};
			for (let i = 0; i < words.length; i++) {
				if (seen[words[i]]) {
					let theWord = words[i];
					if (!duplicates[theWord]) {
						duplicates[theWord] = [words.indexOf(theWord)];
						duplicates[theWord].push(i);
					} else {
						duplicates[theWord].push(i);
					}
				} else {
					seen[words[i]] = true;
				}
			}
			expect(
				duplicates,
				`Found ${Object.keys(duplicates).length} duplicate words in answer list`
			).toEqual({});
		}
	});
});

import rejectedList from '../wordlists/rejected.txt?raw';

describe('blocked words', () => {
	it('words marked "blocked" in rejected.txt are not valid guesses', () => {
		const blocked = rejectedList
			.split('\n')
			.map((line) => line.split('\t'))
			.filter(([, reason]) => reason?.startsWith('blocked'))
			.map(([word]) => word);
		expect(blocked.length).toBeGreaterThan(0);
		expect(blocked.filter((w) => isValid(w))).toEqual([]);
	});
});

import { displayableWords } from './words';

describe('displayable words', () => {
	it('hides offensive words from lists shown to players, but keeps them as guesses', () => {
		const offensive = rejectedList
			.split('\n')
			.map((line) => line.split('\t'))
			.filter(([, reason]) => reason === 'offensive')
			.map(([word]) => word)
			.filter((w) => isValid(w));
		expect(offensive.length).toBeGreaterThan(0);
		const shown = new Set(displayableWords);
		expect(offensive.filter((w) => shown.has(w))).toEqual([]);
	});
});
