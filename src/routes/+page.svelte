<script lang="ts">
	import { setSavedGame } from './../lib/gameInProgress';
	import GuessArea from '../lib/GuessArea.svelte';
	import Tutorial from './../lib/Tutorial.svelte';
	import Keyboard from '../lib/Keyboard.svelte';
	import { isValid } from '$lib/words';
	import { onMount } from 'svelte';
	import { computeFeedback } from '$lib/wordFeedback';
	import EndScreen from '$lib/EndScreen.svelte';
	import type { Game } from '$lib/types';
	import { gameManager } from '$lib/gameManager.svelte';
	import { getWordIdentifier } from '$lib/encoder';

	let theGame: Game = $state({
		id: 9999999,
		type: 'extra',
		word: 'filler'
	});

	let { id: puzzleId, word: theWord, type: mode } = $derived(theGame);

	let guesses: string[] = $state([]);
	let nextGuess: string = $state('');
	let isInvalid: boolean = $state(false);
	let offerNewGameAvailable: boolean = $state(false);
	let isRight = $derived(guesses[guesses.length - 1] === theWord);
	let initialized = $state(false);
	let playedDaily: boolean = $state(false);
	// feedback object
	let feedback = $derived(computeFeedback(guesses, theWord));
	// shorthand
	let { letterFeedback, progress, minWordLength, letterKnowledge } = $derived(feedback);

	onMount(() => {
		if (localStorage.getItem('seenTutorial')) {
			showTutorial = false;
		}
		gameManager.setNewDailyCallback(() => {
			// If a daily is available we offer it...
			playedDaily = false;
			offerNewGameAvailable = true;
		});
		let gameAndGuesses = gameManager.loadInitialGame();

		guesses = gameAndGuesses.guesses;
		theGame = gameAndGuesses;
		initialized = true;
	});

	$effect(() => {
		if (initialized) {
			setSavedGame({
				currentWord: theWord,
				guesses: guesses,
				puzzleType: mode,
				puzzleId: puzzleId
			});
		}
	});

	let titleFilter = $derived.by(() => {
		if (isRight || guesses.length == 0) {
			return 'none';
		} else {
			let blur = 4 * (1 - progress);
			return `blur(${blur}px)`;
		}
	});

	function interpolateColor(start: number[], end: number[], factor: number): number[] {
		let result = start.slice();
		for (let i = 0; i < 3; i++) {
			result[i] = Math.round(result[i] + factor * (end[i] - start[i]));
		}
		return result;
	}

	let backgroundAdjustments = $derived.by(() => {
		if (guesses.length == 0) {
			return '';
		} else if (!isRight) {
			// Otherwise, adjust based on progress
			// Out baseline goes from...
			// 3,10,38 -> 63,64,74 -> 181,184,183
			// So we can do a linear interpolation between these
			// three colors and
			let startOne = [3, 10, 38];
			let endOne = [3, 10, 85];
			let startTwo = [63, 64, 74];
			let endTwo = [14, 56, 190];
			let startThree = [181, 184, 183];
			let endThree = [56, 206, 235];
			let progressPercentage = progress;
			// So we move progressPercentage of the way from startOne to endOne, etc.
			let stopOne = interpolateColor(startOne, endOne, progressPercentage);
			let stopTwo = interpolateColor(startTwo, endTwo, progressPercentage);
			let stopThree = interpolateColor(startThree, endThree, progressPercentage);
			// Now build the gradient
			let gradient = `linear-gradient(to bottom, rgb(${stopOne.join(',')}), rgb(${stopTwo.join(',')}), rgb(${stopThree.join(',')}))`;
			let bg = `background-image: ${gradient}, url('/fog.svg');`;
			return bg;
		} else if (isRight) {
			// complete puzzle background is...
			// clear blue sky linear gradient
			let gradient = `linear-gradient(to bottom,  rgb(3, 10, 85), rgb(14, 56, 190), rgb(56, 206, 235))`;
			let bg = `background-image: ${gradient}, url('/fog.svg');`;

			let positions = `background-position: center bottom, center ${window.innerHeight}px`; // animate fog off
			return `${bg} ; ${positions} ; background-repeat: no-repeat;`;
		}
	});

	function submitGuess() {
		// Should we allow guesses that aren't long enough
		// even on the last guess?
		//if (nextGuess.length >= minWordLength) {
		if (isValid(nextGuess)) {
			guesses = [...guesses, nextGuess];
			nextGuess = '';
		} else {
			isInvalid = true;
		}
	}

	// Handle keydown events
	function handleKeydown(event: KeyboardEvent) {
		const key = event.key.toLowerCase();

		if (/^[a-z]$/.test(key)) {
			// If the key is a letter, add it to the guess
			nextGuess += key;
			isInvalid = false;
		} else if (key === 'backspace' || key === 'delete') {
			// Handle backspace or delete
			nextGuess = nextGuess.substring(0, nextGuess.length - 1);
			isInvalid = false;
		} else if (key === 'enter') {
			// Handle submit
			submitGuess();
			event.preventDefault();
		}
	}

	let showTutorial = $state(true);
</script>

{#if showTutorial}
	<Tutorial
		onClose={() => {
			showTutorial = false;
			localStorage.setItem('seenTutorial', 'true');
		}}
	/>
{:else}{/if}
<main style={backgroundAdjustments}>
	<div class="top">
		<span class="mode">
			{#if mode === 'daily'}
				<button
					id="daily-toggle"
					class="daily"
					onclick={() => {
						gameManager.setMode('extra');
						theGame = gameManager.getNewExtraGame();
						guesses = theGame.guesses;
						nextGuess = '';
					}}
				>
					{new Date().toLocaleDateString('en-US', { month: 'numeric', day: '2-digit' })}
				</button>
			{:else}
				<button
					id="daily-toggle"
					class="infinite"
					onclick={() => {
						gameManager.setMode('daily');
						theGame = gameManager.getDailyGame();
						guesses = theGame.guesses;
						nextGuess = '';
					}}
				>
					∞
				</button>
			{/if}
			{#if mode === 'daily'}
				<label for="daily-toggle">Daily Puzzle</label>
				<b>#{puzzleId + 1}</b>
			{:else if mode === 'extra'}
				<b>#{getWordIdentifier(theWord)}</b>
				<br />
				<label class="detail" for="daily-toggle"> Unlimited Mode </label>
			{/if}
		</span>
		<div class="title-box">
			<h1 style:--title-filter={titleFilter}>Fo<span class="g">g</span>gle</h1>
			{#if offerNewGameAvailable && mode !== 'daily'}
				<button
					class="cta"
					onclick={() => {
						gameManager.setMode('daily');
						theGame = gameManager.getDailyGame();
						guesses = [];
						nextGuess = '';
						offerNewGameAvailable = false;
					}}>New Daily Puzzle Available!</button
				>
			{/if}
		</div>
		<div style="display: flex; justify-content: flex-end">
			<button
				class="tutorial-button"
				onclick={() => (showTutorial = true)}
				data-tooltip="Show Tutorial">?</button
			>
		</div>
	</div>

	{#key theWord}
		<GuessArea {theWord} {guesses} {isInvalid} {isRight} {nextGuess} {feedback}></GuessArea>
		<!-- Input -->
		{#if !isRight && guesses.length < 6}
			<Keyboard
				{letterFeedback}
				oninput={(ltr: string) => {
					nextGuess += ltr;
					isInvalid = false;
				}}
				ondelete={() => {
					nextGuess = nextGuess.substring(0, nextGuess.length - 1);
					isInvalid = false;
				}}
				onsubmit={submitGuess}
				lastLetter={nextGuess[nextGuess.length - 1]}
			/>
		{:else}
			<EndScreen
				{theWord}
				{guesses}
				{feedback}
				victory={isRight}
				{mode}
				onPlayAgain={() => {
					gameManager.setMode('extra');
					const gameAndGuesses = gameManager.getNewExtraGame();
					guesses = gameAndGuesses.guesses;
					theGame = gameAndGuesses;
				}}
			/>
		{/if}
	{/key}
</main>
<!-- Global Keydown Listener -->
<svelte:window on:keydown={handleKeydown} />

<style>
	button {
		font-family: 'Indoor Kid Web';
		background: transparent;
		border: none;
		text-decoration: wavy underline white;
		color: white;
	}
	button:hover {
		text-shadow: 2px 2px 1px rgb(28, 53, 8);
	}
	main {
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-evenly;
		height: 100dvh;
		width: 100vw;
		position: fixed;
		top: 0;
		left: 0;
		padding: 1rem;
		gap: 8px;
		--linear-gradient-stop-one: rgb(3, 10, 38);
		--linear-gradient-stop-two: rgb(63, 64, 74);
		--linear-gradient-stop-three: rgb(181, 184, 183);
		--base: linear-gradient(
			to bottom,
			var(--linear-gradient-stop-one),
			var(--linear-gradient-stop-two),
			var(--linear-gradient-stop-three)
		);
		background: var(--base), url('fog.svg');
		background-blend-mode: multiply;
		background-size: cover;
		background-position: center bottom;
		font-family: 'Indoor Kid Web';
		text-shadow: 2px 2px 3px rgba(10, 50, 26, 0.467);
		color: rgb(238, 237, 246);
		transition:
			background-image 1s ease-in-out,
			background-position 2s ease-in-out;
	}

	.mode {
		/* position: fixed; */
		top: 1rem;
		left: 1rem;
		text-shadow: 2px 2px #222;
	}
	.mode .detail {
		font-size: 0.8em;
	}
	.tutorial-button {
		/* position: fixed; */
		top: 1rem;
		right: 1rem;
		font-size: 2rem;
		background: transparent;
		border: none;
		color: white;
		text-shadow: 2px 2px 3px rgba(10, 50, 26, 0.467);
		z-index: 99;
		text-decoration: none;
		width: 3rem;
		height: 3rem;
	}
	.tutorial-button:hover {
		background: #222;
		border-radius: 50%;
	}

	h1 {
		margin: 0;
		font-size: 2rem;
		font-stretch: 130%;
		font-weight: 100;
		letter-spacing: -0.1em;
		/* Use text shadow to do an outline in addition to our shadow */
		text-shadow:
			-1px -1px 0px rgba(4, 23, 12, 0.8),
			1px 1px 0px rgba(4, 23, 12, 0.8),
			-1px 1px 0px rgba(4, 23, 12, 0.8),
			1px -1px 0px rgba(4, 23, 12, 0.8),
			6px 6px 6px rgb(25, 78, 47);
		filter: var(--title-filter);
	}
	.g {
		letter-spacing: -0.3em;
	}
	@media (min-width: 1080px) {
		h1 {
			font-size: 3rem;
			margin: 0.5rem;
		}
	}
	@media (max-width: 800px) {
		h1 {
			font-size: 1.5rem;
			margin: 0;
		}
		.tutorial-button {
			top: 0.5rem;
		}
	}
	@media (max-width: 460px) {
		:root,
		main {
			font-size: 13px;
		}
	}

	#daily-toggle {
		background: var(--white);
		color: #222;
		font-size: small;
		display: inline-grid;
		place-content: center;
		border-radius: 50%;
		width: 3rem;
		height: 3rem;
		text-decoration: none;
		vertical-align: middle;
	}
	#daily-toggle:hover {
		background: #222;
		color: var(--white);
		text-shadow: none;
		filter: drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.5));
	}
	.infinite:hover::after {
		content: 'Back to Daily';
	}
	#daily-toggle.daily:hover::after {
		content: 'Infinite Mode';
	}
	#daily-toggle {
		position: relative;
	}
	#daily-toggle::after {
		position: absolute;
		top: 2rem;
		left: 50%;
		transform: translateX(-50%);
		font-size: 0.5rem;
		background: rgba(0, 0, 0, 0.8);
		color: white;
	}
	.cta {
		background: var(--white);
		color: #222;
		font-size: small;
		padding: 0.5rem;
		border-radius: 0.5rem;
		text-decoration: none;
	}
	.cta:hover {
		text-shadow: none;
		filter: drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.5));
	}
	.top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		width: 100%;
	}
	.top :nth-child(1),
	.top :nth-child(3) {
		flex-basis: 30%;
	}
	.top :nth-child(2) {
		flex-basis: 40%;
		text-align: center;
	}
</style>
