<script lang="ts">
	import { CORRECT_L, CORRECT_R, CORRECT_B, PRESENT, INCORRECT } from './types';
	import type { FEEDBACK } from './types';

	const NOANSWER = '';
	let {
		word,
		answer,
		feedback,
		align = 'center',
		animate = false
	}: {
		word: string;
		answer: string;
		feedback: FEEDBACK[] | undefined;
		align?: 'left' | 'right' | 'center';
		animate?: boolean;
	} = $props();

	// For RTL, reverse the array for correct wrapping
	let letters = $derived(align === 'right' ? Array.from(word).reverse() : Array.from(word));
	let hasFeedback = !!feedback;

	// Track if alignment has ever changed since mount
	let prevAlign = $state(align);
	let alignChangeCount = $state(0);
	let mounted = $state(false);

	$effect(() => {
		if (mounted && align !== prevAlign) {
			alignChangeCount++;
			prevAlign = align;
		}
	});
	$effect(() => {
		mounted = true;
	});
	let alignmentEverChanged = $derived(alignChangeCount > 0);
	let doAnimate = $derived(animate && !alignmentEverChanged);
</script>

<div
	class="wordrow {align}"
	class:animate
	class:no-feedback={!hasFeedback}
	data-change-count={alignChangeCount}
	{...align === 'right' ? { dir: 'rtl' } : {}}
>
	{#each letters as letter, i (align === 'right' ? word.length - 1 - i : i)}
		{@const origIndex = align === 'right' ? word.length - 1 - i : i}
		{@const letterNum = align === 'right' ? letters.length - i : i + 1}
		<div
			class="letter"
			class:no-anim={!doAnimate}
			style="--letter-num: {letterNum}"
			class:present={feedback && feedback[origIndex] === PRESENT}
			class:correct-left={feedback && feedback[origIndex] === CORRECT_L}
			class:correct-right={feedback && feedback[origIndex] === CORRECT_R}
			class:correct-left-and-right={feedback && feedback[origIndex] === CORRECT_B}
			class:incorrect={feedback && feedback[origIndex] === INCORRECT}
		>
			{letter}
		</div>
	{/each}
</div>

<style>
	:root {
		--correct: #0e6a23db;
		--present: #ea842bc2;
		--incorrect: #6c757d;
		--white: #f1edede1;
		--ltr-height: 1.5em;
		--ltr-width: 1.5em;
		--font-size: 2rem;
		--letter-delay: 200ms;
	}
	@media (max-width: 480px) {
		:root {
			--ltr-width: 1.2em;
			--ltr-height: 1.2em;
		}
	}

	.wordrow {
		display: flex;
		gap: calc(4px * var(--stretch, 1));
		flex-wrap: wrap;
		justify-content: start;
		width: 100%;
	}
	.wordrow.right {
		direction: rtl;
		text-align: right;
	}
	.wordrow.left {
		direction: ltr;
		text-align: left;
	}
	.wordrow.center {
		direction: ltr;
		text-align: center;
		justify-content: center;
	}

	.letter {
		font-family: 'Indoor Kid Web';
		font-size: var(--font-size, 2rem);
		font-weight: bold;
		padding: 8px;
		border-radius: 8px;
		display: grid;
		place-content: center;
		text-align: center;
		width: var(--ltr-width);
		height: var(--ltr-height);
		background: radial-gradient(circle, var(--white) 70%, transparent 100%);
		text-shadow: 2px 2px 3px rgba(255, 255, 255, 0.644);
		color: #224;
		box-sizing: border-box;
		animation-name: pop-in;
		animation-duration: 300ms;
		animation-timing-function: ease-out;
		animation-fill-mode: both;
		animation-delay: calc(var(--letter-num, 1) * var(--letter-delay));
	}

	/* Feedback Styles */
	.present {
		background: radial-gradient(circle, var(--present) 70%, transparent 100%);
		backdrop-filter: blur(2px);
		animation-name: pop-in, fade-to-present;
		animation-duration: 300ms, 300ms;
		animation-timing-function: ease-out, ease-out;
		animation-fill-mode: both, both;
		animation-delay: calc(var(--letter-num, 1) * var(--letter-delay)),
			calc(var(--letter-num, 1) * var(--letter-delay));
		color: var(--white);
	}

	.incorrect {
		background: var(--incorrect);
		color: #ffffff;
		filter: brightness(0.7);
		animation-name: pop-in, fade-to-incorrect;
		animation-duration: 300ms, 300ms;
		animation-timing-function: ease-out, ease-out;
		animation-fill-mode: both, both;
		animation-delay: calc(var(--letter-num, 1) * var(--letter-delay)),
			calc(var(--letter-num, 1) * var(--letter-delay));
	}

	.correct-left {
		background: linear-gradient(to right, var(--correct) 40%, var(--incorrect) 60%);
		color: var(--white);
		animation-name: pop-in, fade-to-correct-left;
		animation-duration: 300ms, 300ms;
		animation-timing-function: ease-out, ease-out;
		animation-fill-mode: both, both;
		animation-delay: calc(var(--letter-num, 1) * var(--letter-delay)),
			calc(var(--letter-num, 1) * var(--letter-delay));
	}

	.correct-right {
		background: linear-gradient(to left, var(--correct) 40%, var(--incorrect) 60%);
		color: var(--white);
		animation-name: pop-in, fade-to-correct-right;
		animation-duration: 300ms, 300ms;
		animation-timing-function: ease-out, ease-out;
		animation-fill-mode: both, both;
		animation-delay: calc(var(--letter-num, 1) * var(--letter-delay)),
			calc(var(--letter-num, 1) * var(--letter-delay));
	}

	.correct-left-and-right {
		background: var(--correct);
		border: 3px solid var(--correct);
		animation-name: pop-in, fade-to-correct-both;
		animation-duration: 300ms, 300ms;
		animation-timing-function: ease-out, ease-out;
		animation-fill-mode: both, both;
		animation-delay: calc(var(--letter-num, 1) * var(--letter-delay)),
			calc(var(--letter-num, 1) * var(--letter-delay));
	}

	@keyframes pop-in {
		0% {
			transform: scale(0.5);
			color: transparent;
			opacity: 0;
		}
		100% {
			transform: scale(1);
			color: rgb(255, 255, 255);
			text-shadow: 2px 2px 3px rgba(18, 54, 1, 0.644);
			opacity: 1;
		}
	}

	@keyframes fade-to-present {
		from {
			background: transparent;
		}
		to {
			background: radial-gradient(circle, var(--present) 70%, transparent 100%);
		}
	}

	@keyframes fade-to-incorrect {
		from {
			background: transparent;
		}
		to {
			background: var(--incorrect);
		}
	}

	@keyframes fade-to-correct-left {
		from {
			background: transparent;
		}
		to {
			background: linear-gradient(to right, var(--correct) 40%, var(--incorrect) 60%);
		}
	}

	@keyframes fade-to-correct-right {
		from {
			background: transparent;
		}
		to {
			background: linear-gradient(to left, var(--correct) 40%, var(--incorrect) 60%);
		}
	}

	@keyframes fade-to-correct-both {
		from {
			background: transparent;
		}
		to {
			background: var(--correct);
		}
	}

	.wordrow.no-feedback .letter {
		animation: none !important;
	}

	.letter.no-anim {
		animation: none !important;
		animation-name: none !important;
		/* Always apply feedback colors and text-shadow even if animation is off */
		color: #224;
		text-shadow: 2px 2px 3px rgba(255, 255, 255, 0.644);
	}

	.letter.no-anim.present,
	.letter.no-anim.correct-left,
	.letter.no-anim.correct-right,
	.letter.no-anim.correct-left-and-right {
		color: var(--white);
		text-shadow: 2px 2px 3px rgba(18, 54, 1, 0.644);
	}
	.letter.no-anim.incorrect {
		color: #fff;
		text-shadow: 2px 2px 3px rgba(18, 54, 1, 0.644);
	}
</style>
