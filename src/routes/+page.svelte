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
	

	let theGame : Game = $state({
		id : 9999999,
		type : 'extra',
		word : 'filler'
	});

	let {
		id : puzzleId,		
		word : theWord,
		type : mode } = $derived(theGame);		

	let guesses: string[] = $state([]);
	let nextGuess: string = $state('');
	let isInvalid: boolean = $state(false);
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
		console.log('Running onMount!');
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
			if (nextGuess.length >= minWordLength) {
				if (isValid(nextGuess)) {
					guesses = [...guesses, nextGuess];
					nextGuess = '';
				} else {
					isInvalid = true;
				}
			}
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
{:else}
	<button class="tutorial-button" onclick={() => (showTutorial = true)} data-tooltip="Show Tutorial"
		>?</button
	>
{/if}
<main>
	<span class="mode">
		{#if mode === 'daily'}
			Daily Puzzle <b>#{puzzleId+1}</b>
		{:else if mode === 'extra'}
			<b>#{getWordIdentifier(theWord)}</b>
			<br/><span class="detail">Unlimited Mode</span>
		{/if}
	</span>
	<h1 style:--title-filter={titleFilter}>Fo<span class="g">g</span>gle</h1> 

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
			onsubmit={() => {
				if (isValid(nextGuess)) {
					guesses = [...guesses, nextGuess];
					nextGuess = '';
				} else {
					isInvalid = true;
				}
			}}
			lastLetter={nextGuess[nextGuess.length - 1]}
		/>
    {:else}
        <EndScreen
            theWord={theWord}
            guesses={guesses}
            feedback={feedback}
            victory={isRight}
			mode={mode}
            onPlayAgain={() => {				
                theGame = gameManager.getNewGame();
				guesses = [];
				nextGuess = '';
            }}
        />
	{/if}
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
		background-image: url('/bg-comic.png');
		background-size: cover;
		background-position: center;
		font-family: 'Indoor Kid Web';
		text-shadow: 2px 2px 3px rgba(10, 50, 26, 0.467);
		color: rgb(238, 237, 246);
	}
	
	.mode {
		position: fixed;
		top: 1rem;
		left: 1rem;
		text-shadow: 2px 2px #222;
	}
	.mode .detail {
		font-size: 0.8em;
	}
	.tutorial-button {
		position: fixed;
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
</style>
