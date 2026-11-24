import { CORRECT_B, CORRECT_L, CORRECT_R, INCORRECT, PRESENT } from './types';
import type { FEEDBACK } from './types';
import { computeWordFeedback } from './wordFeedback';

export type ClueMark = 'present' | 'absent' | 'need-left' | 'need-right' | 'ban-left' | 'ban-right';

type Conflict = {
	kind: 'needs' | 'bans';
	mark: ClueMark;
	label: string;
	plain: boolean;
};

export function getGuessConflicts(candidate: string, guesses: string[], feedback: FEEDBACK[][]) {
	const rules = new Map<string, Conflict>();
	const tiles: ClueMark[][][] = guesses.map((word) => Array.from(word, () => []));
	for (const [row, word] of guesses.entries()) {
		const expected = feedback[row];
		const actual = computeWordFeedback(word, candidate).word;

		function add(index: number, rule: Conflict) {
			rules.set(`${rule.mark}:${rule.label}`, rule);
			const marks = tiles[row][index];
			if (!marks.includes(rule.mark)) marks.push(rule.mark);
		}

		for (const letter of new Set(word)) {
			const indices = Array.from(word, (value, index) =>
				value === letter ? index : -1
			).filter((index) => index !== -1);
			const label = letter.toUpperCase();
			const knownPresent = indices.some((index) => expected[index] !== INCORRECT);
			if (!knownPresent && candidate.includes(letter)) {
				for (const index of indices)
					add(index, { kind: 'bans', mark: 'absent', label, plain: true });
				continue;
			}

			let positionConflict = false;
			for (const index of indices) {
				for (const [side, green, position] of [
					['left', CORRECT_L, index + 1],
					['right', CORRECT_R, word.length - index]
				] as const) {
					const wasGreen = expected[index] === green || expected[index] === CORRECT_B;
					const wouldBeGreen = actual[index] === green || actual[index] === CORRECT_B;
					if (wasGreen === wouldBeGreen) continue;
					positionConflict = true;
					add(index, {
						kind: wasGreen ? 'needs' : 'bans',
						mark: wasGreen ? `need-${side}` : `ban-${side}`,
						label: `${label} ${ordinal(position)} from the ${side}`,
						plain: false
					});
				}
			}

			if (knownPresent && !candidate.includes(letter)) {
				for (const index of indices) {
					if (expected[index] === PRESENT)
						add(index, { kind: 'needs', mark: 'present', label, plain: true });
				}
			} else if (!positionConflict) {
				// Yellow tiles count copies left over after matching both ends.
				const yellows = indices.filter((index) => expected[index] === PRESENT);
				const actualYellows = indices.filter((index) => actual[index] === PRESENT);
				const difference = yellows.length - actualYellows.length;
				if (difference === 0) continue;
				const needs = difference > 0;
				for (const index of indices) {
					if (expected[index] !== actual[index]) {
						add(index, {
							kind: needs ? 'needs' : 'bans',
							mark: needs ? 'present' : 'absent',
							label: needs
								? `More unmatched copies of ${label}`
								: `Extra unmatched copies of ${label}`,
							plain: false
						});
					}
				}
			}
		}
	}
	return rules.size ? { rules: [...rules.values()], tiles } : null;
}

function ordinal(position: number) {
	const endings = ['th', 'st', 'nd', 'rd'];
	const lastTwo = position % 100;
	return `${position}${lastTwo >= 11 && lastTwo <= 13 ? 'th' : (endings[position % 10] ?? 'th')}`;
}

/**
 * True when every guess in this game obeys the hard-mode rules — that is, each
 * guess was consistent with all the clues that were available when it was made.
 *
 * This is derived from the guesses themselves rather than from a stored flag, so
 * it is deterministic, works for games played before hard mode existed, and
 * can't be lost by a stale or legacy save.
 */
export function playedWholeGameHard(guesses: string[], answer: string): boolean {
	if (!answer) return false;
	const guessFeedback = guesses.map((guess) => computeWordFeedback(guess, answer).word);
	return guesses.every(
		(guess, i) => !getGuessConflicts(guess, guesses.slice(0, i), guessFeedback.slice(0, i))
	);
}
