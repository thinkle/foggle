import { describe, it, expect } from 'vitest';
import { decode, decodeClue, encode, encodeClue, getWordIdentifier } from './encoder';

describe('computeFeedback', () => {
	it('Raw encoding and decoding should work for lower case words!', () => {
		const words = ['apples', 'couches', 'banana', 'zeus', 'ridiculous', 'perhaps'];
		const encoded = words.map(encode);
		const decoded = encoded.map(decode);
		for (let i = 0; i < words.length; i++) {
			expect(decoded[i]).toBe(words[i]);
		}
	});
	it('Clue encoding and decoding should work for lower case words!', () => {
		const words = ['apples', 'couches', 'banana', 'zeus', 'ridiculous', 'perhaps'];
		const encoded = words.map(encodeClue);
		const decoded = encoded.map(decodeClue);
		for (let i = 0; i < words.length; i++) {
			expect(decoded[i]).toBe(words[i]);
		}
	});
	it('Clues should not have an obvious visible length', () => {
		const words = [
			'apples',
			'ridiculously',
			'go',
			'establishment',
			'for',
			'couches',
			'banana',
			'zeus',
			'ridiculous',
			'perhaps'
		];
		const encoded = words.map(encodeClue);
		for (let i = 0; i < words.length; i++) {
			expect(encoded[i].length).toBeGreaterThan(30);
			console.log(encoded[i], '\t', words[i]);
		}
	});
	it('Identifiers should be unique and easy to look at', () => {
		const words = [
			'apples',
			'ridiculously',
			'go',
			'establishment',
			'for',
			'couches',
			'banana',
			'zeus',
			'ridiculous',
			'perhaps'
		];
		const identifiers = words.map(getWordIdentifier);
		const unique = new Set(identifiers);
		expect(unique.size).toBe(words.length);
		for (let i = 0; i < words.length; i++) {
			console.log(identifiers[i], '\t', words[i]);
		}
	});
});
