import { describe, it, expect } from 'vitest';
import { getAnswerWords } from './words';
import { decodeClue } from './encoder';

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
