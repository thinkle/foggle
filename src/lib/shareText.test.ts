import { describe, it, expect } from 'vitest';
import { generateShareText } from './shareText';
import { INCORRECT, CORRECT_B, CORRECT_L, CORRECT_R, PRESENT } from './types';

describe('makeEmojiString', () => {
	it('should return victory string for all correct feedback', () => {
		const guesses = ['it'];
		const word = 'it';
		const result = generateShareText(guesses, word);
		expect(result).toContain('🟩🟩🏆🟩🟩');
	});
	it('should generate victory string for correct guess after incorrect guesses.', () => {
		const guesses = ['apple', 'grape', 'peach'];
		const theWord = 'peach';
		const result = generateShareText(guesses, theWord);
		expect(result).toContain('🟩🟩🏆🟩🟩');
	});

	it('should handle no guesses', () => {
		const guesses: string[] = [];
		const theWord = 'peach';
		const result = generateShareText(guesses, theWord);
		expect(result).toBe('');
	});

	it('should handle all incorrect guesses', () => {
		const guesses = ['apple', 'grape', 'melon'];
		const theWord = 'peach';
		const result = generateShareText(guesses, theWord);
		expect(result).toContain('⬛');
	});

	it('should handle mixed feedback', () => {
		const guesses = ['apple', 'peach'];
		const theWord = 'peach';
		const result = generateShareText(guesses, theWord);
		expect(result).toContain('🟨');
		expect(result).toContain('🟩🟩🏆🟩🟩');
	});
	it('should center the green square on center-aligned guesses', () => {
		const guesses = ['cryer'];
		const theWord = 'fryer';
		const result = generateShareText(guesses, theWord);
		expect(result).toContain('⬛⬛🟩⬛⬛');
	});
	it('should center green w/ fog when unsure of length', () => {
		const guesses = ['pxxuxxxn'];
		const word = 'population';
		const result = generateShareText(guesses, word);
		expect(result).toContain('🌫️⬛🟩⬛🌫️');
	});
});
