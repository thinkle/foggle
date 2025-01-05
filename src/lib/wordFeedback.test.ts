import { describe, it, expect } from 'vitest';

import { computeFeedback } from './wordFeedback';
import { CORRECT_B, CORRECT_L, CORRECT_R, PRESENT, INCORRECT, CORRECT_SPLIT } from './types';

describe('computeFeedback', () => {
	it('should return correct feedback for correct guess', () => {
		const guesses = ['apple'];
		const answer = 'apple';
		const result = computeFeedback(guesses, answer);
		console.log(result);
		expect(result.guessFeedback).toEqual([[CORRECT_B, CORRECT_B, CORRECT_B, CORRECT_B, CORRECT_B]]);
		expect(result.letterKnowledge).toEqual([CORRECT_B, CORRECT_B, CORRECT_B, CORRECT_B, CORRECT_B]);
		expect(result.progress).toBe(1);
	});

	it('should return correct feedback for incorrect guess', () => {
		const guesses = ['orange'];
		const answer = 'skip';
		const result = computeFeedback(guesses, answer);
		console.log(result);
		expect(result.guessFeedback).toEqual([
			[INCORRECT, INCORRECT, INCORRECT, INCORRECT, INCORRECT, INCORRECT]
		]);
		expect(result.letterKnowledge).toEqual(['unknown', 'unknown', 'unknown', 'unknown']);
		expect(result.progress).toBe(0);
	});

	it('should return correct feedback for partially correct guess', () => {
		const guesses = ['apple'];
		const answer = 'orange';
        
		const result = computeFeedback(guesses, answer);
		console.log(result);
		expect(result.guessFeedback).toEqual([
			[
				PRESENT, // a
				INCORRECT, // p
				INCORRECT, // p
				INCORRECT, // l
				CORRECT_R // e
			]
		]);
		expect(result.letterKnowledge).toEqual([
			'unknown',
			'unknown',
			'present',
			'unknown',
			'unknown',
			CORRECT_R
		]);
		expect(result.letterFeedback['a']).toBe(PRESENT);
		expect(result.letterFeedback['e']).toBe(CORRECT_R);
		expect(result.progress).toEqual((0.5 + 0.333)/6);
	});


    it('should return tricky "both" for double letter matching from both sides', () => {
        const guesses = ['right'];
        const answer =   'bigger';
        const result = computeFeedback(guesses, answer);
        expect(result.guessFeedback).toEqual([
            [
                PRESENT, // r
                CORRECT_L, // i
                CORRECT_B, // g
                INCORRECT, // h
                INCORRECT, // t                
            ]
        ]);
        expect(result.letterFeedback['g']).toBe(CORRECT_B);
    });
    it('Should return keyboard feedback "split" for left/right match not from same spot', () => {
        const answer = 'radar';
        const guesses = ['redactor'];
        const result = computeFeedback(guesses, answer);
        expect(result.guessFeedback).toEqual([
            [
                CORRECT_L, // r
                INCORRECT, // e
                CORRECT_L, // d
                CORRECT_L, // a
                INCORRECT, // c
                INCORRECT, // t
                INCORRECT, // o
                CORRECT_R, // r
            ]
        ]); 
        expect(result.letterFeedback['r']).toBe(CORRECT_SPLIT);
    });
    
});
