import { describe, it, expect, vi } from 'vitest';
import { getPossibleWords } from './foggleBot';

// Mock the ./words module so validWords is a small array
/* vi.mock('./words', () => {
    return {
      validWords: [
        'a',
        'aa',
        'aloft',
        'amp',
        'ample', 
        'an',
        'apple', 
        'apply', 
        'assert',
        'assure',
        'baker',
    ]
    };
  });  */
describe('getPossibleWords', () => {
	it('should return possible words based on guesses and answer', () => {
		const guesses = ['apple', 'apply', 'adore', 'zeus'];
		const answer = 'ample';

		const result = getPossibleWords(guesses, answer);

		expect(result).toEqual(['ample']);
	});
	it('should eliminate words based on missing letters', () => {
		const guesses = ['thequickredfox', 'jumpedoverthe', 'lzybrowndogs'];
		const answer = 'a';
		const result = getPossibleWords(guesses, answer);
		expect(result).toEqual(['a', 'aa']);
	});

	it('should narrow from left and right', () => {
		const guesses = ['or', 'bakes'];
		const answer = 'baker';
		const result = getPossibleWords(guesses, answer);
		expect(result).toEqual(['baker']);
	});

	it('should narrow based on present positions', () => {
		const answer = 'assure';
		const guesses = [
			'tasks', // a can't be second
			'spark', // a can't be third
			'rebar', // a can't be fourth
			'taiga' // a can't be fifth
		];
		const result = getPossibleWords(guesses, answer);
		expect(result).toEqual(['assure']);
	});

	it('should narrow based on word length', () => {
		const answer = 'discombobulate';
		const guesses = [
			'hated',
			'combination' // the "c" matches from the right
		];
		const result = getPossibleWords(guesses, answer);
		expect(result).toEqual(['discombobulate']);
	});

	it('should eliminate letters we know are not in the word at a given position', () => {
		const answer = 'course';
		const guesses = ['raspberries'];
		const result = getPossibleWords(guesses, answer);
		const resultsWithS = result.filter((word) => word[word.length - 1] == 's');
		expect(resultsWithS).toEqual([]);
	});
	it('Should not have the number of candidate words go up after a guess', () => {
		const answer = 'deride';
		const guesses = ['stupefaction', 'bide', 'glide', 'deride'];
		let lastWordsLeft = Infinity;
		let lastWords = [];
		for (let guessLength = 1; guessLength <= guesses.length; guessLength++) {
			const currentGuesses = guesses.slice(0, guessLength);
			const result = getPossibleWords(currentGuesses, answer);
			try {
				expect(result.length).toBeLessThanOrEqual(lastWordsLeft);
			} catch (e) {
				console.log('Guesses: ', currentGuesses);
				console.log('Last words: ', lastWords);
				console.log('Current words: ', result);
				throw e;
			}
			lastWordsLeft = result.length;
			lastWords = result;
		}
	});
});
