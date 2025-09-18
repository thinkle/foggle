/* Not really a bot, but inspired by the idea of e.g. WordleBot...
 *  This module will provide feedback based on the allowable guesses
 *  and the feedback a user has so far.
 */

import { getConstraints, type Constraints } from './wordFeedback';
import { validWords } from './words';

export const getPossibleWords = (guesses: string[], answer: string): string[] => {
	let candidates = validWords;
	for (let n = 0; n < guesses.length; n++) {
		const { constraints, letterCounts, letterExclusions } = getConstraints(
			guesses.slice(0, n + 1),
			answer
		);
		candidates = candidates.filter((word) =>
			applyConstraints(word, constraints, letterCounts, letterExclusions)
		);
	}
	return candidates;
};

function applyConstraints(
	word: string,
	constraints: Constraints,
	letterCounts: { [letter: string]: number },
	letterExclusions: { [letter: string]: number }
): boolean {
	if (!word) return false;
	for (const forbiddenLength of constraints.forbiddenLengths) {
		if (word.length === forbiddenLength) {
			return false;
		}
	}
	if (word.length < constraints.minSizeBasedOnRight) {
		return false;
	}
	for (const constraint of constraints.leftBasedLetters) {
		if (constraint) {
			if (word[constraint.index] !== constraint.letter) {
				return false;
			}
		}
	}
	for (const constraint of constraints.rightBasedLetters) {
		if (constraint) {
			if (word[word.length - constraint.index] !== constraint.letter) {
				return false;
			}
		}
	}
	for (const constraint of constraints.leftBasedExclusions) {
		if (constraint) {
			if (word[constraint.index] === constraint.letter) {
				return false;
			}
		}
	}
	for (const constraint of constraints.rightBasedExclusions) {
		if (constraint) {
			if (word[word.length - constraint.index] === constraint.letter) {
				return false;
			}
		}
	}
	for (const letter in letterCounts) {
		if (word.split(letter).length - 1 < letterCounts[letter]) {
			return false;
		}
	}
	for (const letter in letterExclusions) {
		if (word.split(letter).length - 1 >= letterExclusions[letter]) {
			//console.log('Excluding',word,'because it has too many',letter)
			return false;
		}
	}
	return true;
}
