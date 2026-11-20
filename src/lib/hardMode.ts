import { CORRECT_B, CORRECT_L, CORRECT_R, INCORRECT, PRESENT } from './types';
import type { FEEDBACK } from './types';
import { computeWordFeedback } from './wordFeedback';

export function getGuessConflict(candidate: string, guesses: string[], feedback: FEEDBACK[][]) {
	for (const [row, guess] of guesses.entries()) {
		const expected = feedback[row];
		const actual = computeWordFeedback(guess, candidate).word;
		const tile = expected.findIndex((clue, index) => clue !== actual[index]);
		if (tile === -1) continue;

		const letter = guess[tile];
		const label = letter.toUpperCase();
		for (const [side, green, position] of [
			['right', CORRECT_R, guess.length - tile],
			['left', CORRECT_L, tile + 1]
		] as const) {
			const wasGreen = expected[tile] === green || expected[tile] === CORRECT_B;
			const wouldBeGreen = actual[tile] === green || actual[tile] === CORRECT_B;
			if (wasGreen !== wouldBeGreen) {
				const rule = wasGreen ? 'must' : 'can’t';
				return {
					row,
					tile,
					reason:
						position === 1
							? `${label} ${rule} be the ${side === 'left' ? 'first' : 'last'} letter.`
							: `${label} ${rule} be in position ${position} from the ${side}.`
				};
			}
		}

		const reason =
			expected[tile] === PRESENT
				? candidate.includes(letter)
					? `You need another ${label} outside the matching positions in this row.`
					: `Your guess must include ${label}.`
				: expected.some((clue, index) => guess[index] === letter && clue !== INCORRECT)
					? `This guess leaves too many unmatched copies of ${label}.`
					: `${label} can’t be in the word.`;
		return { row, tile, reason };
	}
	return null;
}
