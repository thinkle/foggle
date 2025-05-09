<script lang="ts">
	import { getDayIndex } from '../wordlists/magicNumber.js';
	import type { PuzzleType } from './gameInProgress.ts';
	import type { ComputedFeedback, FEEDBACK } from './types.ts';
	import { getPossibleWords } from './foggleBot';
	import { computeFeedback } from './wordFeedback';
	import { CORRECT_L, CORRECT_R, CORRECT_B, PRESENT, INCORRECT } from './types';
	import { generateShareText } from './shareText.js';

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
	const shareUrl = 'https://www.fogglegame.com';
	// Handlers for sharing and copying.
	function handleShare() {
		navigator
			.share({
				//title: shareTitle,
				text: shareTitle + '\n' + shareText,
				url: shareUrl
			})
			.catch((e) => console.error('Share failed:', e));
	}
	let shareTitle = 'Foggle Result';
	let shareText = '';
	if (mode === 'daily') {
		// If we're in daily mode, we need to get the day index.
		let dayIndex = getDayIndex();
		shareTitle = `Foggle #${dayIndex + 1} ${victory ? '✅' : '❌'}\n`;
	}
	shareText += generateShareText(guesses, theWord);

	function handleCopy() {
		navigator.clipboard
			.writeText(`${shareTitle}\n${shareText}\n${shareUrl}`)
			.then(() => console.log('Copied to clipboard!'))
			.catch((e) => console.error('Copy failed:', e));
	}
</script>

<!-- Preview the share text (monospaced via <pre>) -->
<!-- <pre style="font-family: monospace;">{shareText}</pre> -->

<button class="icon-button share" onclick={handleShare} aria-label="Share Foggle results">
	<!-- "Arrow out of a box" share icon -->
	<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
		<!-- Example path (arrow up out of a box) -->
		<path
			d="M17 21H3c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h5v2H3v14h14v-5h2v5c0 1.1-.9 2-2 2zm-3-14V2l5 4-5 4V6c-3.31 0-6 2.69-6 6v3H8v-3c0-4.42 3.58-8 8-8z"
		/>
	</svg>
	<span>Share</span>
</button>

<button class="icon-button copy" onclick={handleCopy} aria-label="Copy Foggle results">
	<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
		<!-- A simple 'copy/clipboard' icon path (example) -->
		<path
			d="M16 1H4c-1.11 0-2 .89-2 2v14h2V3h12V1zm3 4H8c-1.11 0-2 .89-2 2v14c0 1.1.89 2 2 2h11c1.11 0 2-.9 2-2V7c0-1.11-.89-2-2-2zm0 16H8V7h11v14z"
		/>
	</svg>
	<span>Copy</span>
</button>

<style>
	pre {
		text-align: left;
	}
</style>
