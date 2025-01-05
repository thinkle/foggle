import { describe, it, expect } from 'vitest';

import { computeFeedback } from './wordFeedback';
import { CORRECT_B, CORRECT_L, CORRECT_R, PRESENT, INCORRECT, CORRECT_SPLIT } from './types';

describe('computeFeedback', () => {
	it('should return correct feedback for correct guess', () => {
		const guesses = ['apple'];
		const answer = 'apple';
		const result = computeFeedback(guesses, answer);
		//console.log(result);
		expect(result.guessFeedback).toEqual([[CORRECT_B, CORRECT_B, CORRECT_B, CORRECT_B, CORRECT_B]]);
		expect(result.letterKnowledge).toEqual([CORRECT_B, CORRECT_B, CORRECT_B, CORRECT_B, CORRECT_B]);
		expect(result.progress).toBe(1);
	});

	it('should return correct feedback for incorrect guess', () => {
		const guesses = ['orange'];
		const answer = 'skip';
		const result = computeFeedback(guesses, answer);
		//console.log(result);
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
		//console.log(result);
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
        expect(result.guessFeedback,
			buildDebugMessage(guesses,answer,result)
		).toEqual([
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
	describe('Min Word Length Tests', () => {
		describe('Min length should be calculated for green square at edge of word', () => {
			for (const guess of ['axxxx','xxxxe']) {
				it(`should return minWordLength of 5 for ${guess}=>apple`, () => {
					const guesses = [guess];
					const answer = 'apple';
					const result = computeFeedback(guesses, answer);		
					expect(result.minWordLength,
						buildDebugMessage(guesses,answer,result)
					).toBe(5);
				})
			}		
		});
		it('should not double-count letters present from two directions', () => {
			const target = 'apple';
			const guess = 'applexxxxe';
			const guesses = [guess];			
			const result = computeFeedback(guesses, target);		
			expect(result.minWordLength,
				buildDebugMessage(guesses,target,result)
			).toBe(5);			
		});

		describe('Min length should be calculated based on number of unique letters',
			() => {
				for (const [target,guess,minWordLength] of [
					['apple','xxxxpxlxxxxxxaxxxxx',3],
					['apple','pleop',4],
					['apple','eeav',2],
					['apple','plape',5],
					['apple','plaepplaep',5]					
				] ) {
					it(`should return minWordLength of ${minWordLength} for ${guess}=>${target}`, () => {
						const guesses = [guess as string];
						const answer = target as string;
						const result = computeFeedback(guesses, answer);							
						expect(result.minWordLength,
							buildDebugMessage(guesses,answer,result)
						).toBe(minWordLength);
					})
				}
			}
		);

		describe (
			'We should know double letters can be tricky',
			() => {
				const guess = 'ribber';
				const target = 'bib';
				const result = computeFeedback([guess], target);
				it('ribber=>bib should infer 3 letters', () => {
					expect(result.minWordLength,
						buildDebugMessage([guess],target,result)
					).toBe(3);
				});
			}
		)

		describe(
			'We should account for blank letters that must fit somewhere',
			() => {
				let guess = 'night';
				let target = 'biggot';
				// so we have *three* letters right
				// and the "g" is the third so that could be right
				// BUT if it's three letters long, it has to be
				// gig, and we know the "t" is last, so it can't
				// be 3 letters long!
				// 
				// because the "i" is second...
				// but it could be xigxt, right? -- like digit?
				// so it *must* be at least 5 letters
				let result = computeFeedback([guess], target);
				it('night=>biggot should infer 6 letters through fanciness', () => {					
					expect(result.minWordLength,
						buildDebugMessage([guess],target,result)
					).toBe(5);
				});
				it('night => bagger: Should be just three without the other letters though',
					() => {
						target = 'bagger';
						result = computeFeedback([guess], target);
						// can I log result.template here if the test fails
						expect(result.minWordLength,
							buildDebugMessage([guess],target,result)
						).toBe(3);
					}
				);
				describe('cumulative guesses should work together', () => {
					it('bring, piggy => big should infer 3', () => {
						const guesses = ['bring','piggy'];
						const target = 'big';
						const result = computeFeedback(guesses, target);
						expect(result.minWordLength,
							buildDebugMessage(guesses,target,result)
						).toBe(3);
					})					
				})

			}
		);

		describe(
			'We understand that partially correct answers eliminate lengths from consideration',
			() => {
				it(
					'A partial correct implies the length of our guess is wrong',
					() => {
						const guess = 'an';
						const target = 'ant';
						const result = computeFeedback([guess], target);
						expect(result.minWordLength,
							buildDebugMessage([guess],target,result)
						).toBe(3);
					}
				);
				it(
					'A partial correct does NOT necessarily make the length longer though',
					() => {
						const guess = 'an';
						const target = 'a';
						const result = computeFeedback([guess], target);
						expect(result.minWordLength,
							buildDebugMessage([guess],target,result)
						).toBe(1);
					}
				)
				it(
					'Multiple guesses work with partial logic...',
					() => {
						const guesses = ['cat','at','or'];
						const target = 'catheter';
						const result = computeFeedback(guesses, target);
						expect(result.minWordLength,
							buildDebugMessage(guesses,target,result)
						).toBe(4);
					}
				);
				it(
					'We can make tricky inferences using different info in different spots',
					() => {
						const target = 'container';
						const guesses = [
							'part', // must be at least 4 based on "t' position
							'chump', // can't be 5 because of particl "c" correctness
						];
						const result = computeFeedback(
							guesses,
							target
						);
						expect(
							result.minWordLength,
							buildDebugMessage(guesses,target,result)							
						).toBe(6);
					}
				);
			}
		)

	})	    
});

function buildDebugMessage (guesses, target, result) {
	return `Feedback for ${guesses.join(',')}=>${target} is \n${JSON.stringify(result, null, 2)}`;
}