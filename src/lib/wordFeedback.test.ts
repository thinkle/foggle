import { describe, it, expect } from 'vitest';

import { computeFeedback, getConstraints, type Constraint } from './wordFeedback';
import { CORRECT_B, CORRECT_L, CORRECT_R, PRESENT, INCORRECT, CORRECT_SPLIT } from './types';
import { getDailyWord } from './words';

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
		expect(result.progress).toEqual((0.5 + 0.333) / 6);
	});

	it('should return tricky "both" for double letter matching from both sides', () => {
		const guesses = ['right'];
		const answer = 'bigger';
		const result = computeFeedback(guesses, answer);
		expect(result.guessFeedback, buildDebugMessage(guesses, answer, result)).toEqual([
			[
				PRESENT, // r
				CORRECT_L, // i
				CORRECT_B, // g
				INCORRECT, // h
				INCORRECT // t
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
				CORRECT_R // r
			]
		]);
		expect(result.letterFeedback['r']).toBe(CORRECT_SPLIT);
	});
	describe('Min Word Length Tests', () => {
		describe('Min length should be calculated for green square at edge of word', () => {
			for (const guess of ['axxxx', 'xxxxe']) {
				it(`should return minWordLength of 5 for ${guess}=>apple`, () => {
					const guesses = [guess];
					const answer = 'apple';
					const result = computeFeedback(guesses, answer);
					expect(result.minWordLength, buildDebugMessage(guesses, answer, result)).toBe(5);
				});
			}
		});
		it('should not double-count letters present from two directions', () => {
			const target = 'apple';
			const guess = 'applexxxxe';
			const guesses = [guess];
			const result = computeFeedback(guesses, target);
			expect(result.minWordLength, buildDebugMessage(guesses, target, result)).toBe(5);
		});

		describe('Min length should be calculated based on number of unique letters', () => {
			for (const [target, guess, minWordLength] of [
				['apple', 'xxxxpxlxxxxxxaxxxxx', 3],
				['apple', 'pleop', 4],
				['apple', 'eeav', 2],
				['apple', 'plape', 5],
				['apple', 'plaepplaep', 5]
			]) {
				it(`should return minWordLength of ${minWordLength} for ${guess}=>${target}`, () => {
					const guesses = [guess as string];
					const answer = target as string;
					const result = computeFeedback(guesses, answer);
					expect(result.minWordLength, buildDebugMessage(guesses, answer, result)).toBe(
						minWordLength
					);
				});
			}
		});

		describe('We should know double letters can be tricky', () => {
			const guess = 'ribber';
			const target = 'bib';
			const result = computeFeedback([guess], target);
			it('ribber=>bib should infer 3 letters', () => {
				expect(result.minWordLength, buildDebugMessage([guess], target, result)).toBe(3);
			});
		});

		describe('We should account for blank letters that must fit somewhere', () => {
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
				expect(result.minWordLength, buildDebugMessage([guess], target, result)).toBe(5);
			});
			it('night => bagger: Should be just three without the other letters though', () => {
				target = 'bagger';
				result = computeFeedback([guess], target);
				// can I log result.template here if the test fails
				expect(result.minWordLength, buildDebugMessage([guess], target, result)).toBe(3);
			});
			describe('cumulative guesses should work together', () => {
				it('bring, piggy => big should infer 3', () => {
					const guesses = ['bring', 'piggy'];
					const target = 'big';
					const result = computeFeedback(guesses, target);
					expect(result.minWordLength, buildDebugMessage(guesses, target, result)).toBe(3);
				});
			});
		});

		describe('We understand that partially correct answers eliminate lengths from consideration', () => {
			it('A partial correct implies the length of our guess is wrong', () => {
				const guess = 'an';
				const target = 'ant';
				const result = computeFeedback([guess], target);
				expect(result.minWordLength, buildDebugMessage([guess], target, result)).toBe(3);
			});
			it('A partial correct does NOT necessarily make the length longer though', () => {
				const guess = 'an';
				const target = 'a';
				const result = computeFeedback([guess], target);
				expect(result.minWordLength, buildDebugMessage([guess], target, result)).toBe(1);
			});
			it('Multiple guesses work with partial logic...', () => {
				const guesses = ['cat', 'at', 'or'];
				const target = 'catheter';
				const result = computeFeedback(guesses, target);
				expect(result.minWordLength, buildDebugMessage(guesses, target, result)).toBe(4);
			});
			it('We can make tricky inferences using different info in different spots', () => {
				const target = 'container';
				const guesses = [
					'part', // must be at least 4 based on "t' position
					'chump' // can't be 5 because of particl "c" correctness
				];
				const result = computeFeedback(guesses, target);
				expect(result.minWordLength, buildDebugMessage(guesses, target, result)).toBe(6);
			});
		});
	});
	describe('Present letters show up in template (odd numbered)', () => {
		const guesses = ['apple'];
		const answer = 'addle';
		const template = 'a??le';
		const result = computeFeedback(guesses, answer);
		it('addle for apple', () => {
			expect(result.template, buildDebugMessage(guesses, answer, result)).toBe(template);
		});
		const guessesCentered = 'upold';
		const templateCentered = 'ppll';
		const resultCentered = computeFeedback([guessesCentered], 'apple');
		it('upold for apple', () => {
			expect(
				resultCentered.template,
				buildDebugMessage([guessesCentered], 'apple', resultCentered)
			).toBe(templateCentered);
		});
	});
	describe('Present letters show up in template (even numbered)', () => {
		const guesses = ['apples'];
		const answer = 'addles';
		const template = 'a??les';
		const result = computeFeedback(guesses, answer);
		it('outer letters right (even number)', () => {
			expect(result.template, buildDebugMessage(guesses, answer, result)).toBe(template);
		});
		const guesses2 = ['rages'];
		const answer2 = 'saver';
		const template2 = '?a?e?';
		const result2 = computeFeedback(guesses2, answer2);
		it('inner letters right (even number)', () => {
			expect(result2.template, buildDebugMessage(guesses2, answer2, result2)).toBe(template2);
		});
	});
	describe('Weird corner cases from playing', () => {
		describe('Template should be reasonable', () => {
			const guesses = ['handkerchief'];
			const answer = 'cartographer'; //getDailyWord(new Date(2025,0,9));
			//const template = '?a????r???e?';
			const template = 'aa???rr??ee';
			const result = computeFeedback(guesses, answer);
			it('should have a reasonable template', () => {
				expect(result.template, buildDebugMessage(guesses, answer, result)).toBe(template);
			});
		});
		describe('Unusual shortest word hint?', () => {
			it('Weird case from a screenshot', () => {
				const guesses = [
					// P_P?L?RPPP???
					// TRADITIONALLY
					'traditionally',
					// RRLP???
					// INCOMES
					'incomes',
					// ?PPPRRP?
					// POINTING
					'pointing'
				];
				// SO FROM THE LEFT WE HAVE...
				// ??C?I??????
				// and from the right we have...
				//         IN?TI
				// and the computer showed
				// the hint as...
				// ??CNITI??
				// But we *shouldn't allow an "N"
				// not next to an "I"...
				// so we expect...
				// ??CNITI??
				//
				// ??C?IN?TI??
				const answer = 'vaccination';
				const result = computeFeedback(guesses, answer);
				expect(result.template, buildDebugMessage(guesses, answer, result)).toBe('??c?in?ti??');
			});

			it('Bug found in the wild with wrong word length', () => {
				const answer = 'relevant';
				const guesses = ['perseveration', 'venerate'];
				const result = computeFeedback(guesses, answer);
				console.log('Feedback for bug was', result);
				expect(result.template, buildDebugMessage(guesses, answer, result)).toBe('?e?e?a??');
			});
		});
	});
});

describe('getConstraints', () => {
	describe('We should calculate right-based exclusions based on non-matched positions', () => {
		it('Should know that "s" can\'t be last', () => {
			const guesses = ['parks'];
			const answer = 'stage';
			const feedback = getConstraints(guesses, answer);
			const expectedFeedback = { index: 1, side: 'right', letter: 's' };
			const foundExpectedFeedback: Constraint | undefined =
				feedback.constraints.rightBasedExclusions.find((constraint) => {
					return (
						constraint &&
						constraint.index == expectedFeedback.index &&
						constraint.letter == expectedFeedback.letter
					);
				});
			expect(foundExpectedFeedback).toEqual(expectedFeedback);
		});
		it('Should know that "s" can\'t be last when there are two "s"s', () => {
			const guesses = ['parks'];
			const answer = 'asset';
			const feedback = getConstraints(guesses, answer);
			const expectedFeedback = { index: 1, side: 'right', letter: 's' };
			const foundExpectedFeedback: Constraint | undefined =
				feedback.constraints.rightBasedExclusions.find((constraint) => {
					return (
						constraint &&
						constraint.index == expectedFeedback.index &&
						constraint.letter == expectedFeedback.letter
					);
				});
			expect(foundExpectedFeedback, buildDebugMessage(guesses, '-', feedback)).toEqual(
				expectedFeedback
			);
		});

		it('Should know that "s" can\'t be last when there are two "s"s even if correct from left', () => {
			const guesses = ['parks'];
			const answer = 'sparse';
			const feedback = getConstraints(guesses, answer);
			const expectedFeedback = { index: 1, side: 'right', letter: 's' };
			const foundExpectedFeedback: Constraint | undefined =
				feedback.constraints.rightBasedExclusions.find((constraint) => {
					return (
						constraint &&
						constraint.index == expectedFeedback.index &&
						constraint.letter == expectedFeedback.letter
					);
				});
			if (!foundExpectedFeedback) {
				console.log(
					'Feedback missing expected exclusion for final S:',
					JSON.stringify(feedback, null, 2)
				);
			}
			expect(foundExpectedFeedback, buildDebugMessage(guesses, '-', feedback)).toEqual(
				expectedFeedback
			);
		});
	});
});

function buildDebugMessage(guesses, target, result) {
	return `Feedback for ${guesses.join(',')}=>${target} is \n${JSON.stringify(result, null, 2)}`;
}
