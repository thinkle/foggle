<script lang="ts">
	import { getWordIdentifier } from './encoder';
	import { getGameHistory, type GameResult, type SavedGame } from './gameInProgress';
	import { getPuzzleIdFromWord } from './words';

	let { theWord, victorious, mode } = $props();
	let completeHistory = $derived(theWord ? getGameHistory() : []);
	let currentGame = $derived.by(() => {
		if (victorious) {
			return {
				puzzleId: getPuzzleIdFromWord(theWord),
				puzzleType: mode,
				solved: true,
				guesses: [theWord],
				currentWord: theWord,
				timestamp: Date.now()
			};
		}
	});

	let modeHistory = $derived.by(() => {
		let hist = completeHistory.filter((g) => g.puzzleType === mode);
		if (victorious && currentGame) {
			hist.push(currentGame);
		}
		return hist.reverse();
	});

	let streak = $derived.by(() => {
		// We're moving backwards through games here...
		const streak: SavedGame[] = [];
		let lastId = modeHistory[0]?.puzzleId;
		for (let game of modeHistory) {
			if (mode === 'extra' && !game.solved) {
				// For the "extra" mode -- our streak is just how
				// many in a row we have solved.
				return streak;
			} else if (mode === 'extra') {
				streak.push(game);
			} else if (game.puzzleId === lastId) {
				// We're still on the first puzzle in the list
				// just add it...
				if (streak.length === 0) {
					streak.push(game);
				} else {
					// ignore dups...
					console.log('Ignoring duplicate game in history', game);
				}
			} else if (game.puzzleId == lastId - 1) {
				// If it's a contiguous puzzle, we add it to the streak...
				if (game.solved || game.guesses.length === 6) {
					lastId = game.puzzleId;
					streak.push(game);
				} else {
					return streak;
				}
			}
		}
		return streak;
	});
	let wins = $derived.by(() => {
		if (mode === 'daily') {
			let winStreak = [];
			for (let s of streak) {
				if (s.solved) {
					winStreak.push(s);
				} else {
					return winStreak;
				}
			}
			return winStreak;
		} else {
			return streak;
		}
	});
	$inspect('The streak is', streak, modeHistory);
</script>

<div class="streak">
	{#if streak.length > 1}
		<span class="fuego">
			{#each Array.from({ length: streak.length }) as _, i}
				🔥
			{/each}
		</span>
	{/if}
	{#if mode === 'daily'}
		{#if streak.length > 1}
			{#if streak.length === wins.length}
				<em>{streak.length}</em> daily puzzles in a row!
			{:else}
				You've played {streak.length} daily puzzles in a row (and solved the last
				<em>{wins.length}</em> of them!)
			{/if}
		{/if}
	{:else if streak.length > 1}
		{streak.length} in a row!
	{/if}
</div>

<style>
	span.fuego {
		display: block;
	}
	div {
		max-width: 15em;
		margin-inline: auto;
		font-size: 0.6em;
		font-feature-settings:
			'ss03' on,
			'ss06' on;
		font-variation-settings: 'EMPH' 85;
		font-stretch: 105%;
	}
	em {
		font-variation-settings: 'EMPH' 125;
	}
</style>
