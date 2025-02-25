<script lang="ts">
	import { getDayIndex } from '../wordlists/magicNumber.js';
	import type { PuzzleType } from './gameInProgress.ts';
	import type { ComputedFeedback } from './types.ts';
	const {
		theWord,
		guesses,
		feedback,
		victory,
		mode
	}: {
		theWord: string;
		guesses: string[];
		feedback: ComputedFeedback;
		victory: boolean;
		mode: PuzzleType;
	} = $props();

	console.log('Feedback is', feedback);

	/* Let's do a few things here... */

	let shareText = '';
	if (victory) {
		// Question -- can we make this <a href="https://www.fogglegame.com">Foggle</a>? or
		// is that not supported with teh share API?
		shareText += 'I solved Foggle #' + getDayIndex();
	} else {
		shareText += 'I tried to solve Foggle #' + getDayIndex();
	}
	// Now let's steal some stuff from the analysis component and add it to shareText in a guess way...
	// Maybe we build a simple table...
	// Guess # | Feedback Types Received | %Clarity | Valid Words Remaining
	// 1       | Indicator of half-green/green/yellow/etc | 52% | 54
	//
</script>

<!-- Preview -- maybe we don't want this or it shows up as a tool tip? -->
<p>{shareText}</p>
<button> Share </button>

<style>
</style>
