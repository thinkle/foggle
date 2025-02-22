<script lang="ts">
	import type { ComputedFeedback } from './types.ts';
	import CurrentGuess from './CurrentGuess.svelte';

	import Word from '$lib/Word.svelte';
	import { onMount } from 'svelte';
	import { CORRECT_L, CORRECT_R } from '$lib/types';
	import { computeFeedback } from './wordFeedback.js';
	import { getPossibleWords } from './foggleBot.js';

	let {
		theWord,
		guesses,
		nextGuess,
		feedback,
		isRight,
		isInvalid,
		justify = undefined,
		isDemo = false,
		letterSize = undefined
	}: {
		theWord: string;
		guesses: string[];
		nextGuess: string;
		feedback: ComputedFeedback | undefined;
		isRight: boolean;
		isInvalid: boolean;
		justify?: 'left' | 'right' | 'center';
		isDemo?: boolean;
		letterSize?: number;
	} = $props();

	if (!feedback) {
		// Compute the feedback if it wasn't provided -- presumably in
		// isDemo mode
		feedback = computeFeedback(guesses, theWord);
		if (!isDemo) {
			throw new Error('Feedback must be provided in non-demo mode');
		}
	}

	let maxGuessLength = $derived.by(() => {
		let maxGuessLength = nextGuess.length;
		for (let guess of guesses) {
			maxGuessLength = Math.max(maxGuessLength, guess.length);
		}
		return maxGuessLength;
	});
	let sizeAdjust = $derived.by(() => {
		if (letterSize) {
			return letterSize;
		}
		if (maxGuessLength > 9) {
			return 1.5;
		} else if (maxGuessLength > 7) {
			return 1.8;
		} else if (maxGuessLength > 5) {
			return 2;
		} else {
			return 2.5;
		}
	});
	let stretch = $derived.by(() => {
		if (maxGuessLength > 16) {
			/* 70% is the narrowest Indoor Kid size */
			return 0.7;
		}
		if (maxGuessLength > 13) {
			return 0.8; /* narrow */
		} else if (maxGuessLength >= 11) {
			return 0.9; /* kinda narrow */
		} else if (maxGuessLength > 8) {
			return 1; /* normal */
		} else if (maxGuessLength > 5) {
			return 1.15; /* wide */
		} else {
			return 1.3; // extended
		}
	});

	let justifyMode: 'left' | 'right' | 'center' = $state(justify || 'center');
	let guessContainer: HTMLDivElement;

	// Adjust justification mode based on word info...
	$effect(() => {
		let push = 0;
		feedback.letterKnowledge.forEach((lk, i) => {
			if (lk === CORRECT_L) {
				push--;
			} else if (lk === CORRECT_R) {
				push++;
			}
		});
		if (push > 0) {
			justifyMode = 'right';
		} else if (push < 0) {
			justifyMode = 'left';
		}
	});
	$effect(() => {
		// reset on new word
		if (guesses.length === 0) {
			justifyMode = 'center';
		}
	});

	// Autoscroll on new guess
	$effect(() => {
		if (guesses.length || nextGuess) {
			guessContainer.scrollTop = guessContainer.scrollHeight;
		}
	});
</script>

<div
	class="guesses"
	bind:this={guessContainer}
	class:center={justifyMode === 'center'}
	class:left={justifyMode === 'left'}
	class:right={justifyMode === 'right'}
	style:--font-size="{sizeAdjust}rem"
	style:--stretch={stretch}
>
	<div class="justify-buttons" class:visible={guesses.length}>
		<button class:active={justifyMode == 'left'} onclick={() => (justifyMode = 'left')}>
			<span class="icon">←</span> Left</button
		>
		<button class:active={justifyMode == 'center'} onclick={() => (justifyMode = 'center')}
			>All</button
		>
		<button class:active={justifyMode == 'right'} onclick={() => (justifyMode = 'right')}>
			Right
			<span class="icon">→</span>
		</button>
	</div>
	{#each guesses as guess, i}
		<Word word={guess} answer={theWord} feedback={feedback.guessFeedback[i]}></Word>
	{/each}
	{#if !isRight && guesses.length < 6}
		<CurrentGuess
			word={nextGuess}
			invalid={isInvalid}
			minWordLength={feedback.minWordLength}
			template={feedback.template}
		></CurrentGuess>
	{/if}
</div>

<style>
	button {
		font-family: 'Indoor Kid Web';
		background: transparent;
		border: none;
		text-decoration: wavy underline white;
		color: white;
	}

	button {
		text-shadow: 2px 2px 1px rgb(28, 53, 8);
	}

	.justify-buttons button {
		text-decoration: none;
	}

	.justify-buttons button.active,
	.justify-buttons button:hover {
		text-decoration: wavy underline white;
	}

	.guesses {
		display: flex;
		flex-direction: column;
		justify-content: start;
		gap: 0.5rem;
		overflow-y: auto;
		flex-grow: 1;
		min-width: min(100vw, 15rem);
	}

	.center {
		align-items: center;
	}

	.center :global(.wordrow) {
		justify-content: center;
	}

	.left {
		align-items: flex-start;
	}

	.left :global(.wordrow) {
		justify-content: start;
	}

	.right {
		align-items: flex-end;
	}

	.right :global(.wordrow) {
		justify-content: end;
	}

	:root {
		--correct-aligned-filter: brightness(1.5) saturate(1.4)
			drop-shadow(1px 16px 3px rgba(9, 152, 9, 0.645));
		--correct-filter: brightness(1.5) saturate(1.4);
		--deemphasize-filter: saturate(0.8);
	}

	/* Adjust highlighting... */
	.right :global(.correct-right),
	.right :global(.correct-left-and-right) {
		filter: var(--correct-aligned-filter);
	}

	.right :global(.correct-left) {
		filter: var(--deemphasize-filter);
	}

	.left :global(.correct-left),
	.left :global(.correct-left-and-right) {
		filter: var(--correct-aligned-filter);
	}

	.left :global(.correct-right) {
		filter: var(--deemphasize-filter);
	}

	.center :global(.correct-left),
	.center :global(.correct-right),
	.center :global(.correct-left-and-right) {
		filter: var(--correct-filter);
	}

	.justify-buttons {
		opacity: 0;
		transition: opacity 0.5s;
		display: flex;
		justify-content: space-between;
		width: 100%;
	}

	.justify-buttons.visible {
		opacity: 1;
	}

	.icon {
		background: rgb(28, 53, 8);
		color: white;
		display: inline-grid;
		place-content: center;
		width: 2em;
		height: 2em;
		border-radius: 50%;
	}

	@keyframes roll-in {
		0% {
			transform: scale(0) translateX(-100%) rotate(-1800deg);
		}

		100% {
			transform: scale(1);
		}
	}
	.guesses {
		--font-stretch: calc(var(--stretch) * 100%);
		--ltr-width: calc(var(--stretch) * 1.5em);
	}
</style>
