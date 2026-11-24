import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * These tests cover what happens when the player returns to daily mode: an
 * in-progress daily must resume, a finished daily must come back from the history,
 * and an unstarted daily must start fresh.
 */

class MemoryStorage {
	private store = new Map<string, string>();
	getItem(key: string): string | null {
		return this.store.has(key) ? (this.store.get(key) as string) : null;
	}
	setItem(key: string, value: string): void {
		this.store.set(key, String(value));
	}
	removeItem(key: string): void {
		this.store.delete(key);
	}
	clear(): void {
		this.store.clear();
	}
}

async function freshModules() {
	// gameInProgress caches attempted dailies in a module-level Set, so every test
	// needs its own copy of the modules alongside its own storage.
	vi.resetModules();
	const gameInProgress = await import('./gameInProgress');
	const { gameManager } = await import('./gameManager.svelte');
	const { getDayIndex } = await import('../wordlists/magicNumber');
	const { getDailyWord } = await import('./words');
	return { gameInProgress, gameManager, getDayIndex, getDailyWord };
}

beforeEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
	vi.stubGlobal('localStorage', new MemoryStorage());
});

describe('getDailyGame', () => {
	it('starts a fresh game when today’s daily has not been played', async () => {
		const { gameManager, getDayIndex, getDailyWord } = await freshModules();
		const game = gameManager.getDailyGame();
		expect(game).toMatchObject({
			id: getDayIndex(),
			type: 'daily',
			word: getDailyWord(),
			guesses: []
		});
	});

	it('resumes an in-progress daily instead of wiping the guesses', async () => {
		const { gameInProgress, gameManager, getDayIndex, getDailyWord } = await freshModules();
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		gameInProgress.setSavedGame({
			currentWord: getDailyWord(),
			guesses: ['stair', 'cloud'],
			puzzleType: 'daily',
			puzzleId: getDayIndex()
		});

		const game = gameManager.getDailyGame();

		expect(game.guesses).toEqual(['stair', 'cloud']);
		expect(game.word).toBe(getDailyWord());
		expect(game.id).toBe(getDayIndex());
		expect(errorSpy).not.toHaveBeenCalled();
	});

	it('still records the in-progress daily as attempted, for the rollover offer', async () => {
		const { gameInProgress, gameManager, getDayIndex, getDailyWord } = await freshModules();
		gameInProgress.setSavedGame({
			currentWord: getDailyWord(),
			guesses: ['stair'],
			puzzleType: 'daily',
			puzzleId: getDayIndex()
		});

		expect(gameInProgress.hasAttemptedDaily(getDayIndex())).toBe(true);
		// Tomorrow's daily is a different puzzle, so the rollover offer still fires.
		expect(gameInProgress.hasAttemptedDaily(getDayIndex() + 1)).toBe(false);
		// Resuming does not finish the game.
		expect(gameManager.getDailyGame().guesses).toEqual(['stair']);
		expect(gameInProgress.getCompletedDaily(getDayIndex())).toBeNull();
	});

	it('resumes a daily that ran out of guesses so the end screen comes back', async () => {
		const { gameInProgress, gameManager, getDayIndex, getDailyWord } = await freshModules();
		const lost = ['stair', 'cloud', 'brine', 'plumb', 'ghost', 'wreck'];
		gameInProgress.setSavedGame({
			currentWord: getDailyWord(),
			guesses: lost,
			puzzleType: 'daily',
			puzzleId: getDayIndex()
		});

		expect(gameManager.getDailyGame().guesses).toEqual(lost);
	});

	it('returns the finished daily from the history once it is solved', async () => {
		const { gameInProgress, gameManager, getDayIndex, getDailyWord } = await freshModules();
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const word = getDailyWord();
		gameInProgress.setSavedGame({
			currentWord: word,
			guesses: ['stair', word],
			puzzleType: 'daily',
			puzzleId: getDayIndex()
		});

		// Solving moves the game out of the in-progress slot and into the history.
		expect(gameInProgress.getSavedGameData('daily')).toBeNull();
		expect(gameInProgress.getCompletedDaily(getDayIndex())).not.toBeNull();

		const game = gameManager.getDailyGame();
		expect(game.guesses).toEqual(['stair', word]);
		expect(game.word).toBe(word);
		expect(errorSpy).not.toHaveBeenCalled();
	});

	it('archives a leftover daily from a previous day and starts today fresh', async () => {
		const { gameInProgress, gameManager, getDayIndex, getDailyWord } = await freshModules();
		const yesterday = getDayIndex() - 1;
		const yesterdaysWord = getDailyWord(new Date(Date.now() - 24 * 60 * 60 * 1000));
		gameInProgress.setSavedGame({
			currentWord: yesterdaysWord,
			guesses: ['stair'],
			puzzleType: 'daily',
			puzzleId: yesterday
		});

		const game = gameManager.getDailyGame();

		expect(game.id).toBe(getDayIndex());
		expect(game.word).toBe(getDailyWord());
		expect(game.guesses).toEqual([]);
		// The old game is kept in the history and no longer shadows today's daily.
		expect(gameInProgress.getSavedGameData('daily')).toBeNull();
		expect(gameInProgress.getCompletedDaily(yesterday)?.guesses).toEqual(['stair']);
	});
});
