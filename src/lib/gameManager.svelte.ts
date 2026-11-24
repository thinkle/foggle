/* Manage resuming game, getting new game, and daily vs. unlimited mode */

import { getDayIndex } from '../wordlists/magicNumber';
import {
	completeSavedGame,
	getCompletedDaily,
	getSavedGame,
	getSavedGameData,
	getSavedMode,
	hasAttemptedDaily,
	hasCompletedExtra,
	setSavedMode,
	type SavedGame
} from './gameInProgress';
import type { Game } from './types';
import { getDailyWord, getRandomGame } from './words';

let completedDaily = $state(false);
let dailyCheckerInterval: null | number = $state(null);
const callbacks: (() => void)[] = [];

type GameAndGuesses = Game & {
	guesses: string[];
	/** Hard mode has been on for the whole game so far (always true before the first guess). */
	hardModeWhole: boolean;
};

// Legacy saves have no flag; treat an in-progress legacy game as not whole-game hard.
function wholeFlag(saved: SavedGame): boolean {
	return saved.hardModeWhole ?? saved.guesses.length === 0;
}

function loadInitialGame(): GameAndGuesses {
	const mode = getSavedMode();
	if (mode === 'daily') {
		const saved = getSavedGame();
		if (saved?.puzzleType === 'daily' && saved?.puzzleId === getDayIndex()) {
			return {
				id: saved.puzzleId,
				type: saved.puzzleType,
				word: saved.currentWord,
				guesses: saved.guesses,
				hardModeWhole: wholeFlag(saved)
			};
		}
		return getDailyGame();
	} else {
		const dailyIndex = getDayIndex();
		if (!hasAttemptedDaily(dailyIndex)) {
			markDailyAvailable();
		}
		return getNewExtraGame();
	}
}

function loadInitialGameOld(): GameAndGuesses {
	let savedGame = getSavedGame();
	if (savedGame?.guesses.length === 6 || savedGame?.solved) {
		completeSavedGame(savedGame);
		savedGame = null;
	}
	if (savedGame) {
		if (savedGame.puzzleType !== 'daily') {
			const daily = getDayIndex();
			console.log('Daily #', daily);
			if (!hasAttemptedDaily(daily)) {
				markDailyAvailable();
			}
		}
		return {
			id: savedGame.puzzleId,
			type: savedGame.puzzleType,
			word: savedGame.currentWord,
			guesses: savedGame.guesses,
			hardModeWhole: wholeFlag(savedGame)
		};
	} else {
		return getDailyGame();
	}
}

function getDailyGame(): GameAndGuesses {
	const todaysPuzzle = getDayIndex();
	const todaysWord = getDailyWord();
	// Returning to daily mode means the player is looking at today's daily again, so
	// stop watching for a new one to become available.
	completedDaily = false;
	if (dailyCheckerInterval) {
		clearInterval(dailyCheckerInterval);
		dailyCheckerInterval = null;
	}

	const savedDaily = getSavedGameData('daily');
	if (savedDaily) {
		if (savedDaily.puzzleId === todaysPuzzle && savedDaily.currentWord === todaysWord) {
			// Today's daily is still in progress (solved games get moved to the history, so
			// anything left here is unfinished or out of guesses) -- resume it rather than
			// handing back a blank board.
			return {
				id: savedDaily.puzzleId,
				type: 'daily',
				word: savedDaily.currentWord,
				guesses: savedDaily.guesses,
				hardModeWhole: wholeFlag(savedDaily)
			};
		}
		// A leftover daily from a previous day: archive it so it stops shadowing today's.
		completeSavedGame(savedDaily);
	}

	const finishedDaily = getCompletedDaily(todaysPuzzle);
	if (finishedDaily) {
		// Already played to the end today -- show it again, end screen and all.
		return {
			id: todaysPuzzle,
			type: 'daily',
			word: finishedDaily.currentWord,
			guesses: finishedDaily.guesses,
			hardModeWhole: wholeFlag(finishedDaily)
		};
	}

	// Today's daily hasn't been started yet.
	return {
		id: todaysPuzzle,
		type: 'daily',
		word: todaysWord,
		guesses: [],
		hardModeWhole: true
	};
}

function getNewExtraGame(level = 1): GameAndGuesses {
	// Check for saved game...
	const savedExtra = getSavedGameData('extra');
	if (savedExtra && savedExtra.guesses.length < 6 && !savedExtra.solved) {
		console.log('Returning saved extra!', savedExtra);
		return {
			id: savedExtra.puzzleId,
			type: 'extra',
			word: savedExtra.currentWord,
			guesses: savedExtra.guesses,
			hardModeWhole: wholeFlag(savedExtra)
		};
	}
	const RECURSION_LIMIT = 50;
	completedDaily = true;
	if (!dailyCheckerInterval) {
		dailyCheckerInterval = window.setInterval(() => {
			if (!hasAttemptedDaily(getDayIndex())) {
				markDailyAvailable();
				clearInterval(dailyCheckerInterval as number);
				dailyCheckerInterval = null;
			}
		}, 10000);
	}
	const game = getRandomGame();
	console.log('Got game', game);
	if (hasCompletedExtra(game.word)) {
		if (level < RECURSION_LIMIT) {
			return getNewExtraGame(level + 1);
		} else {
			return { ...game, guesses: [], hardModeWhole: true };
		}
	} else {
		return { ...game, guesses: [], hardModeWhole: true };
	}
}

export const gameManager = {
	loadInitialGame,
	getNewExtraGame,
	getDailyGame,
	completedDaily,
	setNewDailyCallback: (callback: () => void) => {
		callbacks.push(callback);
	},
	setMode: setSavedMode
};

function markDailyAvailable() {
	for (const cb of callbacks) {
		cb();
	}
}
