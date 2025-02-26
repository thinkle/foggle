import { getPossibleWords } from './foggleBot';
import { INCORRECT, CORRECT_B, CORRECT_L, CORRECT_R, PRESENT } from './types';
import type { ComputedFeedback, FEEDBACK } from './types';
import { computeFeedback } from './wordFeedback';

const SOLID_GREEN = '🟩';
//const GREEN = '🍀';
const GREEN = '🟩';
//const YELLOW = '🌤️';
const YELLOW = '🟨';
const UNKNOWN = '🌫️';
const GREY = '⬛';
const VICTORY = '🏆';
//const UNKNOWN = '❓';
const RIGHT_ARROW = '➡️';
const LEFT_ARROW = '⬅️';

export function generateShareText(guesses: string[], theWord: string) {
	const possibleWordsPerGuess = guesses.map((g, i) =>
		getPossibleWords(guesses.slice(0, i + 1), theWord)
	);

	const fbArray = guesses.map((g, i) => computeFeedback(guesses.slice(0, i + 1), theWord));
	// Build a compact table with fixed-width columns.
	// Fixed widths: guess (2 chars), % revealed (4 chars), feedback (5 chars), words left (4 chars).

	// Build overall share text.
	return buildShareTable(guesses, fbArray, possibleWordsPerGuess);
}

function buildShareTable(
	guesses: string[],
	fbArray: ComputedFeedback[],
	possibleWordsPerGuess: string[][]
) {
	let table = '';
	let lastWordsLeft = -1;
	for (let i = 0; i < guesses.length; i++) {
		const guess = guesses[i];
		const feedback = fbArray[i];
		const wordsLeft = possibleWordsPerGuess[i].length;
		const progress = feedback.progress * 100;
		const emojiString = makeEmojiString(
			feedback.guessFeedback[feedback.guessFeedback.length - 1]
		);
		let row = `${emojiString} ${progress.toFixed(0)}% `;
		if (wordsLeft != lastWordsLeft) {
			row += ` ${wordsLeft} ${wordsLeft == 1 ? 'word' : 'words'} left`;
		}
		lastWordsLeft = wordsLeft;
		row += '\n';
		table += row;
	}
	return table;
}

function makeEmojiString(feedback: FEEDBACK[]) {
	let hasPresent = false;
	let hasWrong = false;
	let hasCorrect = false;
	let hasCorrectB = false;
	let isCorrect = true;
	let alignment = 0; // positive = right, negative = left
	for (let f of feedback) {
		if (f === INCORRECT) {
			hasWrong = true;
			isCorrect = false;
		} else if (f === PRESENT) {
			hasPresent = true;
			isCorrect = false;
		} else if (f === CORRECT_L) {
			hasCorrect = true;
			isCorrect = false;
			alignment -= 1;
		} else if (f === CORRECT_R) {
			hasCorrect = true;
			isCorrect = false;
			alignment += 1;
		} else if (f === CORRECT_B) {
			hasCorrectB = true;
		}
	}
	if (isCorrect) {
		return SOLID_GREEN + SOLID_GREEN + VICTORY + SOLID_GREEN + SOLID_GREEN;
	}
	let emojiArray = [];
	if (hasWrong) {
		emojiArray.push(GREY);
	}
	if (hasPresent) {
		emojiArray.push(YELLOW);
	}

	if (alignment === 0) {
		// centered!
		if (hasCorrect) {
			let green = GREEN;
			if (hasCorrectB) {
				green = SOLID_GREEN;
			}
			if (emojiArray.length == 2) {
				emojiArray = [emojiArray[0] + green + emojiArray[1]];
			} else {
				emojiArray = [...emojiArray, green, ...emojiArray];
			}
			return UNKNOWN + emojiArray.join('') + UNKNOWN;
		} else {
			if (emojiArray.length == 2) {
				return [UNKNOWN, emojiArray[1], ...emojiArray, UNKNOWN].join('');
			} else {
				return UNKNOWN + UNKNOWN + emojiArray[0] + UNKNOWN + UNKNOWN;
			}
		}
	} else if (alignment < 0) {
		// left aligned
		if (hasCorrect) {
			emojiArray = [GREEN, ...emojiArray];
		}
		while (emojiArray.length < 5) {
			emojiArray = [...emojiArray, LEFT_ARROW];
		}
	} else {
		// right aligned
		if (hasCorrect) {
			emojiArray = [...emojiArray, GREEN];
		}
		while (emojiArray.length < 5) {
			emojiArray = [RIGHT_ARROW, ...emojiArray];
		}
	}
	return emojiArray.join('');
}
