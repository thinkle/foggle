<script lang="ts">
	import type { getGuessConflicts } from './hardMode';
	import type { ComputedFeedback } from './types.ts';
	import SpeechBubble from './SpeechBubble.svelte';
	import ClueBorder from './ClueBorder.svelte';
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
		guessConflicts = null,
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
		guessConflicts?: ReturnType<typeof getGuessConflicts>;
		justify?: 'left' | 'right' | 'center' | 'alternate';
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

	let wasManuallyAligned = $state(false);

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

	let justifyMode: 'left' | 'right' | 'center' = $state(
		justify === 'left' || justify === 'right' || justify === 'center' ? justify : 'center'
	);
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
			wasManuallyAligned = false;
			justifyMode = 'right';
		} else if (push < 0) {
			wasManuallyAligned = false;
			justifyMode = 'left';
		}
	});
	// When hard mode rejects a guess, line the words up on whichever side
	// most of the positional reasons count from, so you can see the problem.
	$effect(() => {
		if (!guessConflicts) return;
		let push = 0;
		for (const rule of guessConflicts.rules) {
			if (rule.mark.endsWith('-left')) push--;
			else if (rule.mark.endsWith('-right')) push++;
		}
		if (push > 0) justifyMode = 'right';
		else if (push < 0) justifyMode = 'left';
	});
	$effect(() => {
		// reset on new word
		if (guesses.length === 0) {
			wasManuallyAligned = false;
			justifyMode = 'center';
		}
	});

	// Autoscroll on new guess
	$effect(() => {
		if (guessConflicts || guesses.length || nextGuess) {
			guessContainer.scrollTop = guessContainer.scrollHeight;
		}
	});

	let alternateShift = 'left';

	$effect(() => {
		if (justify === 'alternate') {
			setInterval(() => {
				justifyMode = justifyMode === 'left' ? 'right' : 'left';
			}, 2000);
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
		<button
			class:active={justifyMode == 'left'}
			onclick={() => {
				justifyMode = 'left';
				wasManuallyAligned = true;
			}}
		>
			<span class="icon">←</span> Left
		</button>
		<button
			class:active={justifyMode == 'center'}
			onclick={() => {
				justifyMode = 'center';
				wasManuallyAligned = true;
			}}
		>
			All
		</button>
		<button
			class:active={justifyMode == 'right'}
			onclick={() => {
				justifyMode = 'right';
				wasManuallyAligned = true;
			}}
		>
			Right
			<span class="icon">→</span>
		</button>
	</div>
	{#each guesses as guess, i}
		<Word
			word={guess}
			answer={theWord}
			feedback={feedback.guessFeedback[i]}
			clueMarks={guessConflicts?.tiles[i]}
			align={justifyMode}
			animate={i == guesses.length - 1 && justify !== 'alternate' && !wasManuallyAligned}
		/>
	{/each}
	{#if !isRight && guesses.length < 6}
		<CurrentGuess
			word={nextGuess}
			invalid={isInvalid}
			minWordLength={feedback.minWordLength}
			template={feedback.template}
			align={justifyMode}
		></CurrentGuess>
		<div class="guess-status" role="status">
			{#if guessConflicts}
				<SpeechBubble compact skew="-3deg">
					<div class="rule-groups">
						{#each ['needs', 'bans'] as kind}
							{@const rules = guessConflicts.rules.filter(
								(rule) => rule.kind === kind
							)}
							{#if rules.length}
								<div class="rule-group">
									<strong>{kind === 'needs' ? 'Needs' : 'Can’t have'}</strong>
									<ul>
										{#each rules.filter((rule) => rule.plain) as rule}
											<li class="plain">
												<span class="rule-mark"
													><ClueBorder
														mark={rule.mark}
													/>{rule.label}</span
												>
											</li>
										{/each}
										{#each rules.filter((rule) => !rule.plain) as rule}
											<li>
												{#if rule.mark === 'present' || rule.mark === 'absent'}
													<span class="rule-mark" aria-hidden="true"
														><ClueBorder mark={rule.mark} /></span
													>{rule.label}
												{:else}
													<span class="rule-mark"
														><ClueBorder mark={rule.mark} />{rule
															.label[0]}</span
													>{rule.label.slice(1)}
												{/if}
											</li>
										{/each}
									</ul>
								</div>
							{/if}
						{/each}
					</div>
				</SpeechBubble>
			{/if}
		</div>
	{/if}
</div>

<style>
	.guess-status {
		align-self: center;
		max-width: 100%;
	}
	.guess-status:empty {
		margin-top: -0.5rem;
	}
	.rule-groups {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 0.7rem;
		transform: skewX(3deg);
		font:
			0.875rem/1.25 system-ui,
			sans-serif;
	}
	.rule-group strong {
		font-family: 'Indoor Kid Web', sans-serif;
		font-size: 1.05rem;
		font-weight: 800;
	}
	.rule-group ul {
		list-style: none;
		padding: 0;
		margin: 0.25rem 0 0;
	}
	.rule-group .plain {
		display: inline-block;
	}
	.rule-mark {
		display: inline-grid;
		place-items: center;
		position: relative;
		width: 1.45rem;
		height: 1.45rem;
		margin: 0.08rem 0.3rem 0.08rem 0;
		border-radius: 0.32rem;
		background: var(--white);
		color: #224;
		text-shadow: none;
		font-family: 'Indoor Kid Web', sans-serif;
		font-size: 1rem;
		font-weight: 800;
		vertical-align: middle;
	}
	@media (max-width: 350px) {
		.rule-groups {
			font-size: 0.8rem;
		}
	}
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
	.left {
		align-items: flex-start;
	}

	.right {
		align-items: flex-end;
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
