import {
	type FEEDBACK,
	type ComputedFeedback,
	INCORRECT,
	PRESENT,
	CORRECT_B,
	CORRECT_L,
	CORRECT_R,
	type KEYBOARD_FEEDBACK,
	CORRECT_SPLIT,
	type LetterInfo
} from './types';

export type WordFeedback = {
	word: FEEDBACK[];
	keyboard: { [letter: string]: KEYBOARD_FEEDBACK };
};

export const getConstraints = (guesses: string[], answer: string) => {
	const wordsFeedback = guesses.map((word) => computeWordFeedback(word, answer));
	const guessFeedback = wordsFeedback.map((wf) => wf.word);
	const { letterCounts, letterExclusions } = calculateLetterCounts(guesses, guessFeedback);
	return {
		constraints: calculateConstraints(guesses, guessFeedback),
		letterCounts: letterCounts,
		letterExclusions: letterExclusions
	};
};

export const computeFeedback = (guesses: string[], answer: string): ComputedFeedback => {
	const wordsFeedback = guesses.map((word) => computeWordFeedback(word, answer));
	const guessFeedback = wordsFeedback.map((wf) => wf.word);
	const letterFeedback = mergeKeyboardFeedback(wordsFeedback);

	const letterKnowledge: LetterInfo[] = Array.from(answer).map((letter, i): LetterInfo => {
		let status: LetterInfo;
		for (let guessIndex = 0; guessIndex < guesses.length; guessIndex++) {
			const fb = guessFeedback[guessIndex];
			if ([CORRECT_L, CORRECT_B].includes(fb[i])) {
				// correct from left -- half known
				if (status === CORRECT_R) {
					// early exit
					return CORRECT_B;
				} else {
					status = CORRECT_L;
				}
			}
			const fromRight = answer.length - i;
			const guessFromRightIndex = fb.length - fromRight;
			if ([CORRECT_R, CORRECT_B].includes(fb[guessFromRightIndex])) {
				// correct from right -- half known
				if (status === CORRECT_L) {
					// early exit
					return CORRECT_B;
				} else {
					status = CORRECT_R;
				}
			}
		}
		if (status) return status;
		// now check presence...
		const dupCount = Array.from(answer.substring(0, i)).filter(
			(ltr, idx) => ltr == letter
		).length;
		for (let guessIndex = 0; guessIndex < guesses.length; guessIndex++) {
			const guess = guesses[guessIndex];
			const fb = guessFeedback[guessIndex];
			if (
				fb.filter(
					(letterFeedback, feedbackIndex) =>
						letterFeedback == PRESENT && guess[feedbackIndex] == letter
				).length > dupCount
			) {
				return PRESENT;
			}
		}
		return 'unknown';
	});
	let progressCount = 0;
	for (const known of letterKnowledge) {
		if (known === CORRECT_B) {
			progressCount += 1;
		} else if (known === CORRECT_L || known === CORRECT_R) {
			progressCount += 0.5;
		} else if (known === PRESENT) {
			progressCount += 0.333;
		}
	}
	const progress = progressCount / answer.length;

	const minWordLengthInfo = calculateMinWordLength(guesses, guessFeedback);
	const minWordLength = minWordLengthInfo.length || 1;

	return {
		guessFeedback,
		letterFeedback,
		minWordLength: minWordLength,
		template: minWordLengthInfo.template,
		letterKnowledge,
		progress
	};
};

const keyboardFeedbackManager = () => {
	const keyboardFeedback: { [letter: string]: KEYBOARD_FEEDBACK } = {};
	return {
		keyboardFeedback,
		addLetterFeedback: (letter: string, feedback: FEEDBACK) => {
			if (keyboardFeedback[letter] == CORRECT_B) {
				// already know it's right -- ignore
				if (feedback == INCORRECT) {
					console.error('This should be impossible: algorithm is broken!');
					window.alert(
						'This should be impossible! Please report this bug and send a screenshot to tmhinkle@gmail.com :)!'
					);
				}
				return;
			} else if (keyboardFeedback[letter] == INCORRECT) {
				if (feedback !== INCORRECT) {
					console.error('This should be impossible: algorithm is broken!');
					window.alert(
						'This should be impossible! Please report this bug and send a screenshot to tmhinkle@gmail.com!'
					);
				}
			} else if (feedback == CORRECT_B || feedback == INCORRECT) {
				// these two are easy... just set the feedback
				keyboardFeedback[letter] = feedback;
			} else if (feedback == CORRECT_L) {
				// Now it gets a bit trickier -- we need to check if we already have feedback
				// for this letter and if so, we need to update it.
				if (
					keyboardFeedback[letter] == CORRECT_R ||
					keyboardFeedback[letter] == CORRECT_SPLIT
				) {
					keyboardFeedback[letter] = CORRECT_SPLIT;
				} else {
					keyboardFeedback[letter] = CORRECT_L;
				}
			} else if (feedback == CORRECT_R) {
				if (
					keyboardFeedback[letter] == CORRECT_L ||
					keyboardFeedback[letter] == CORRECT_SPLIT
				) {
					keyboardFeedback[letter] = CORRECT_SPLIT;
				} else {
					keyboardFeedback[letter] = CORRECT_R;
				}
			} else if (feedback == PRESENT) {
				if (!keyboardFeedback[letter]) {
					keyboardFeedback[letter] = PRESENT;
				}
			}
		}
	};
};

const mergeKeyboardFeedback = (
	wordsFeedback: WordFeedback[]
): { [letter: string]: KEYBOARD_FEEDBACK } => {
	const aggregateFeedback: { [letter: string]: KEYBOARD_FEEDBACK } = {};
	// lowest to highest ranking of importance...
	const precedence: KEYBOARD_FEEDBACK[] = [
		CORRECT_B,
		CORRECT_SPLIT,
		CORRECT_L,
		CORRECT_R,
		PRESENT,
		INCORRECT
	];
	wordsFeedback.forEach((wf) => {
		Object.keys(wf.keyboard).forEach((letter) => {
			const current = aggregateFeedback[letter];
			const incoming = wf.keyboard[letter];
			if (!current) {
				aggregateFeedback[letter] = incoming;
			} else if (
				(current == CORRECT_L && incoming == CORRECT_R) ||
				(current == CORRECT_R && incoming == CORRECT_L)
			) {
				aggregateFeedback[letter] = CORRECT_SPLIT;
			} else {
				const currentIdx = precedence.indexOf(current);
				const incomingIdx = precedence.indexOf(incoming);
				if (incomingIdx < currentIdx) {
					aggregateFeedback[letter] = incoming;
				}
			}
		});
	});
	return aggregateFeedback;
};

export const computeWordFeedback = (guess: string, answer: string): WordFeedback => {
	const feedback: FEEDBACK[] = [];
	const kbFdbManager = keyboardFeedbackManager();
	const presentPerLetter: { [letter: string]: number } = {};
	for (let i = 0; i < guess.length; i++) {
		const letter = guess[i];
		const fromRight = guess.length - i;
		const answerRightIndex = answer.length - fromRight;
		if (!answer.includes(letter)) {
			// Missing letter - mark as incorrect!
			kbFdbManager.addLetterFeedback(letter, INCORRECT);
			feedback.push(INCORRECT);
		} else {
			// Now it gets more complicated....
			const correctFromLeft = answer && answer[i] === letter;
			const correctFromRight = answer && answer[answerRightIndex] === letter;
			if (correctFromLeft && correctFromRight) {
				kbFdbManager.addLetterFeedback(letter, CORRECT_B);
				feedback.push(CORRECT_B);
			} else if (correctFromLeft) {
				kbFdbManager.addLetterFeedback(letter, CORRECT_L);
				feedback.push(CORRECT_L);
			} else if (correctFromRight) {
				kbFdbManager.addLetterFeedback(letter, CORRECT_R);
				feedback.push(CORRECT_R);
			} else {
				// PRESENT is a special case because we could have
				// e.g. 4 'e's in the guess and 3 in the answer
				// and need to color only the first 3 present
				const unmatchedInAnswer = Array.from(answer).filter(
					(ltr, idx) =>
						ltr === letter &&
						answer[idx] !== guess[idx] && // Not matched from the left
						answer[idx] !== guess[guess.length - (answer.length - idx)] // Not matched from the right
				).length;
				if (unmatchedInAnswer > (presentPerLetter[letter] || 0)) {
					kbFdbManager.addLetterFeedback(letter, PRESENT);
					feedback.push(PRESENT);
					presentPerLetter[letter] = (presentPerLetter[letter] || 0) + 1;
				} else {
					// no need to update keyboard here since we know this
					// letter is already marked present or correct elsewhere.
					feedback.push(INCORRECT);
				}
			}
		}
	}
	return {
		word: feedback,
		keyboard: kbFdbManager.keyboardFeedback
	};
};

export type Constraint = {
	index: number;
	letter: string;
	side: 'left' | 'right';
};
export type Constraints = {
	leftBasedLetters: (Constraint | undefined)[];
	rightBasedLetters: (Constraint | undefined)[];
	forbiddenLengths: number[];
	minSizeBasedOnRight: number;
	leftBasedExclusions: (Constraint | undefined)[];
	rightBasedExclusions: (Constraint | undefined)[];
};

function calculateConstraints(guesses: string[], guessFeedback: FEEDBACK[][]): Constraints {
	const forbiddenLengths: number[] = [];
	const leftBasedLetters: (Constraint | undefined)[] = [];
	const rightBasedLetters: (Constraint | undefined)[] = [];
	const leftBasedExclusions: (Constraint | undefined)[] = [];
	const rightBasedExclusions: (Constraint | undefined)[] = [];
	let minSizeBasedOnRight = 0;
	for (let i = 0; i < guesses.length; i++) {
		const guess = guesses[i];
		const feedback = guessFeedback[i];
		const length = guess.length;
		let lengthBanned = false; // have we ruled out this length?

		// For convenience, precompute which letters are “used elsewhere in the guess” with non-INCORRECT feedback.
		// We'll use this to detect if INCORRECT actually means “not in *this* position” vs “not in the word at all.”
		function letterHasNonIncorrectElsewhere(letter: string, index: number) {
			return feedback.some(
				(f, otherIndex) =>
					otherIndex !== index &&
					guess[otherIndex] === letter &&
					[PRESENT, CORRECT_L, CORRECT_R, CORRECT_B].includes(f)
			);
		}

		for (let letterIndex = 0; letterIndex < length; letterIndex++) {
			const fromRightIndex = length - letterIndex;
			const letter = guess[letterIndex];
			const fb = feedback[letterIndex];
			if (fb === CORRECT_L || fb === CORRECT_B) {
				leftBasedLetters[letterIndex] = { index: letterIndex, letter, side: 'left' };
			}
			if (fb === CORRECT_R || fb === CORRECT_B) {
				rightBasedLetters[fromRightIndex] = {
					index: fromRightIndex,
					letter,
					side: 'right'
				};
				if (fromRightIndex > minSizeBasedOnRight) {
					minSizeBasedOnRight = fromRightIndex;
				}
			}
			// CORRECT_L implies INCORRECT_R and vice versa
			// so we can exclude the letter from the other side
			if (fb === CORRECT_L) {
				rightBasedExclusions.push({
					index: fromRightIndex,
					letter,
					side: 'right'
				});
			}
			if (fb === CORRECT_R) {
				leftBasedExclusions.push({ index: letterIndex, letter, side: 'left' });
			}
			// Present letters would be green if they were in the right spot
			// so we know they are not in the right spot
			if (fb === PRESENT) {
				rightBasedExclusions.push({
					index: fromRightIndex,
					letter,
					side: 'right'
				});
				leftBasedExclusions.push({ index: letterIndex, letter, side: 'left' });
			}
			// Incorrect letters that are *also* marked PRESENT/CORRECT_L/CORRECT_B/CORRECT_R in another spot
			// in the word also can't be in this spot
			if (fb == INCORRECT && letterHasNonIncorrectElsewhere(letter, letterIndex)) {
				rightBasedExclusions.push({
					index: fromRightIndex,
					letter,
					side: 'right'
				});
				leftBasedExclusions.push({ index: letterIndex, letter, side: 'left' });
			}

			if (!lengthBanned && (fb == CORRECT_R || fb == CORRECT_L)) {
				// then we know the word is not the same length
				// as this guess!
				lengthBanned = true;
				forbiddenLengths.push(length);
			}
		}
	}
	return {
		leftBasedLetters,
		rightBasedLetters,
		leftBasedExclusions,
		rightBasedExclusions,
		forbiddenLengths,
		minSizeBasedOnRight
	};
}

function calculateMinWordLength(
	guesses: string[],
	guessFeedback: FEEDBACK[][]
): {
	length: number;
	template: string;
} {
	const FILL = '?'; // placeholder for unknown letters that must be there
	const MAX_LENGTH = 64;
	const {
		leftBasedLetters,
		rightBasedLetters,
		leftBasedExclusions,
		rightBasedExclusions,
		forbiddenLengths,
		minSizeBasedOnRight
	} = calculateConstraints(guesses, guessFeedback);
	const { letterCounts } = calculateLetterCounts(guesses, guessFeedback);

	// Try each length from the smallest that fits our green letters upward,
	// and return the first one where everything we know can be satisfied.
	const start = Math.max(leftBasedLetters.length, minSizeBasedOnRight, 1);
	for (let length = start; length <= MAX_LENGTH; length++) {
		if (forbiddenLengths.includes(length)) continue;
		const template = tryLength(length);
		if (template) return { template: template.join(''), length };
	}
	// Shouldn't happen with consistent feedback, but don't crash the UI.
	return { template: FILL.repeat(start), length: start };

	// Can a word of this length satisfy everything we know? If so, return
	// its template (known letters + FILL), otherwise null.
	function tryLength(length: number): string[] | null {
		const slots: (string | null)[] = Array(length).fill(null);
		for (const c of leftBasedLetters) {
			if (!c) continue;
			if (slots[c.index] && slots[c.index] !== c.letter) return null;
			slots[c.index] = c.letter;
		}
		for (const c of rightBasedLetters) {
			if (!c) continue;
			const pos = length - c.index; // right indexes are 1-based
			if (pos < 0) return null;
			if (slots[pos] && slots[pos] !== c.letter) return null;
			slots[pos] = c.letter;
		}

		const excluded = (pos: number, letter: string) =>
			leftBasedExclusions.some((c) => c && c.index === pos && c.letter === letter) ||
			rightBasedExclusions.some((c) => c && length - c.index === pos && c.letter === letter);

		// Known letters must not sit in a spot we know they can't be in.
		for (let pos = 0; pos < length; pos++) {
			if (slots[pos] && excluded(pos, slots[pos]!)) return null;
		}

		// Letters we know are in the word but haven't placed yet must each
		// fit into an open slot they aren't excluded from.
		const needed: string[] = [];
		for (const letter in letterCounts) {
			const placed = slots.filter((l) => l === letter).length;
			for (let n = placed; n < letterCounts[letter]; n++) needed.push(letter);
		}
		const open = slots.map((l, pos) => (l ? -1 : pos)).filter((pos) => pos >= 0);
		if (needed.length > open.length) return null;
		if (!canAssign(needed, open, excluded)) return null;

		return slots.map((l) => l || FILL);
	}
}

// Bipartite matching (Kuhn's algorithm): can every needed letter get its
// own open slot without landing on a slot it's excluded from?
function canAssign(
	needed: string[],
	open: number[],
	excluded: (pos: number, letter: string) => boolean
): boolean {
	const slotOwner: number[] = Array(open.length).fill(-1);
	const tryPlace = (li: number, seen: boolean[]): boolean => {
		for (let si = 0; si < open.length; si++) {
			if (seen[si] || excluded(open[si], needed[li])) continue;
			seen[si] = true;
			if (slotOwner[si] === -1 || tryPlace(slotOwner[si], seen)) {
				slotOwner[si] = li;
				return true;
			}
		}
		return false;
	};
	return needed.every((_, li) => tryPlace(li, Array(open.length).fill(false)));
}

export function calculateLetterCounts(guesses: string[], guessFeedback: FEEDBACK[][]) {
	// The number of letters we know the word must have (>=)
	const letterCounts: { [letter: string]: number } = {};
	// The number of letters we know the word must *not* have (>=)
	const letterExclusions: { [letter: string]: number } = {};
	guesses.forEach((guess, guessIndex) => {
		const thisFeedback = guessFeedback[guessIndex];
		// Update to track the actual guesses -- so we need to just keep
		// track did we get e.g.
		// [CORRECT_L, CORRECT_R, PRESENT, INCORRECT]
		//
		// THEN we need to count up but a CORRECT_L and CORRECT_R
		// could point to the *same* letter in the answer, so we
		// don't just count those -- i.e. CORRECT_L = 1,
		// CORRECT_L + CORRECT_R = 1, not 2
		// PRESENT + anything = +1 because PRESENT already checks for dup
		// so PRESENT,PRESENT,CORRECT_L = 3
		//
		// and CORRECT_B = 1 so CORRECT_B, CORRECT_L = 2
		const guessLetterInfo: { [letter: string]: FEEDBACK[] } = {};
		thisFeedback.forEach((feedback, letterIndex) => {
			const letter = guess[letterIndex];
			if (!guessLetterInfo[letter]) {
				guessLetterInfo[letter] = [feedback];
			} else {
				guessLetterInfo[letter].push(feedback);
			}
		});
		const guessLetterCounts: { [letter: string]: number } = {};
		for (const letter in guessLetterInfo) {
			const letterFeedback = guessLetterInfo[letter];
			const lCount = letterFeedback.filter(
				(fb) => fb === CORRECT_L || fb == CORRECT_B
			).length;
			const rCount = letterFeedback.filter(
				(fb) => fb === CORRECT_R || fb == CORRECT_B
			).length;
			const pCount = letterFeedback.filter((fb) => fb === PRESENT).length;
			const lr = Math.max(lCount, rCount);
			guessLetterCounts[letter] = lr + pCount;
			if (letterFeedback.includes(INCORRECT)) {
				// we know this letter is not in the word as many times as it is in
				// our guess...
				const ceiling = lCount + rCount + pCount + 1;
				if (!letterExclusions[letter] || letterExclusions[letter] < ceiling) {
					letterExclusions[letter] = ceiling;
				}
			}
		}
		Object.keys(guessLetterCounts).forEach((letter) => {
			if (!letterCounts[letter]) {
				letterCounts[letter] = guessLetterCounts[letter];
			} else {
				letterCounts[letter] = Math.max(letterCounts[letter], guessLetterCounts[letter]);
			}
		});
	});
	return { letterCounts, letterExclusions };
}
