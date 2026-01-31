<script lang="ts">
	import { getDayIndex } from '../wordlists/magicNumber.js';
	import { getWordIdentifier } from './encoder';
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
		mode,
		puzzleId
	}: {
		theWord: string;
		guesses: string[];
		feedback: ComputedFeedback;
		victory: boolean;
		mode: PuzzleType;
		puzzleId?: number;
	} = $props();
	const baseUrl = 'https://www.fogglegame.com';
	let shareUrl = baseUrl;
	// Handlers for sharing and copying.
	let showShareText = $state(false);
	let shareTextToShow = $state('');
	let shareDialog: HTMLDialogElement | undefined = $state();
	$effect(() => {
		if (shareDialog && showShareText) {
			shareDialog.showModal();
		} else if (shareDialog && !showShareText) {
			shareDialog.close();
		}
	});
	function handleShare() {
		const textToShare = shareTitle + '\n' + shareText + '\n' + shareUrl;
		if (typeof navigator !== 'undefined' && navigator.share) {
			navigator
				.share({
					//title: shareTitle,
					text: textToShare
					// Don't pass url separately since it's already in the text
				})
				.catch((e) => console.error('Share failed:', e));
		} else {
			shareTextToShow = textToShare;
			showShareText = true;
		}
	}
	let shareTitle = 'Foggle Result';
	let shareText = '';
	if (mode === 'daily') {
		// Prefer the puzzle id from the saved game; fall back to today's index.
		let dayIndex = typeof puzzleId === 'number' ? puzzleId : getDayIndex();
		shareTitle = `Foggle #${dayIndex + 1} ${victory ? '✅' : '❌'}\n`;
	} else if (mode === 'extra') {
		const identifier = getWordIdentifier(theWord);
		shareUrl = `${baseUrl}/?p=${encodeURIComponent(identifier)}`;
		shareTitle = `Foggle ∞ #${identifier} ${victory ? '✅' : '❌'}\n`;
	}
	shareText += generateShareText(guesses, theWord);

	function handleCopy() {
		console.log('Copy clicked');
		const textToCopy = `${shareTitle}\n${shareText}\n${shareUrl}`;
		if (
			typeof navigator !== 'undefined' &&
			navigator.clipboard &&
			navigator.clipboard.writeText
		) {
			navigator.clipboard
				.writeText(textToCopy)
				.then(() => console.log('Copied to clipboard!'))
				.catch((e) => {
					console.error('Copy failed:', e);
					shareTextToShow = textToCopy;
					showShareText = true;
				});
		} else {
			shareTextToShow = textToCopy;
			showShareText = true;
		}
	}
</script>

{#if showShareText}
	<dialog bind:this={shareDialog} onclose={() => (showShareText = false)}>
		<button class="close" onclick={() => (showShareText = false)} aria-label="Close dialog"
			>&times;</button
		>
		<h3>Copy and Share</h3>
		<textarea readonly rows="12">{shareTextToShow}</textarea>
	</dialog>
{/if}

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
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.8);
	}
	dialog {
		background: #222;
		color: #fff;
		border-radius: 1em;
		box-shadow: 0 4px 32px rgba(0, 0, 0, 0.25);
		padding: 2em 2em 1em 2em;
		max-width: 32em;
		width: 90vw;
		min-height: 60vh;
		margin: 5vh auto 0 auto;
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		max-height: 85vh;
		overflow-y: auto;
		overflow-x: hidden;
	}
	dialog textarea {
		margin: 1em 0;
		font-size: 1em;
		border-radius: 0.5em;
		border: 1px solid #ccc;
		padding: 0.5em;
		background: #111;
		color: #fff;
		width: 100%;
		font-family: monospace;
		resize: vertical;
		min-height: 16em;
	}
	dialog .close {
		position: absolute;
		top: 8px;
		right: 8px;
		text-decoration: none;
		background: none;
		border: none;
		font-size: 2em;
		color: #fff;
		cursor: pointer;
	}
</style>
