<script lang="ts">
	import SpeechBubble from '$lib/SpeechBubble.svelte';

	import Word from './Word.svelte';

	let { word, invalid, minWordLength, template, align } = $props();
	let tooShort = $derived(word.length < minWordLength);
	// fill array with minWordLength spaces
	// make last item the ellipsis character
	// replace with content of word up to word length characters
	let displayWord = $derived(
		Array.from({ length: Math.max(minWordLength, word.length) }, (_, i) =>
			i < word.length ? word[i] : i === minWordLength - 1 ? '…' : ' '
		)
	);

	let showHint = $state(false);
</script>

<div
	class:invalid
	class="current-guess"
	onclick={() => (showHint = !showHint)}
	onmouseleave={() => (showHint = false)}
	class:too-short={tooShort}
	data-tooltip={tooShort ? 'Word is at least ${minWordLength} letters long.' : ''}
>
	{#key word}{#key displayWord}<Word
				feedback={undefined}
				word={displayWord}
				answer={''}
				{align}
			/>{/key}
	{/key}
	{#if tooShort}<div class="hint-wrap">
			<div class="hint">
				<SpeechBubble position="left">
					Word must be at least <b>{minWordLength}</b>
					{#if minWordLength !== 1}letters{:else}letter{/if} long!
					{#if template && template.search(/\w/) !== -1}
						<br />
						<br />
						{#if showHint}
							<span class="extra-hint">
								(the shortest possible<br /> pattern is<br /><span class="template"
									>{template}</span
								>)
							</span>
						{:else}
							<span class="hint-cue">(click for hint)</span>
						{/if}
					{/if}
				</SpeechBubble>
			</div>
		</div>{/if}
</div>

<style>
	.template {
		white-space: nowrap;
		font-weight: bold;
	}
	.extra-hint {
		font-size: 0.8em;
	}
	.extra-hint .template {
		font-size: 1.2em;
	}
	.hint-cue {
		font-size: 0.8em;
	}
	.current-guess {
		position: relative;
	}
	.hint-wrap {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 75dvh;
		pointer-events: none;
		z-index: 2;
	}
	.hint {
		position: absolute;
		visibility: hidden;
		pointer-events: none;
		bottom: 1em;
		left: 1em;
		width: min(25em, 80vw);
		transition: all 0.5s;
		transform: translateX(-100vw);
	}
	.current-guess:hover .hint {
		visibility: visible;
		animation: blop-in 0.5s forwards;
	}

	@keyframes blop-in {
		0% {
			transform: translateX(-100vw) scaleX(0.5) skewX(-10deg);
		}
		90% {
			transform: translateX(0) scaleX(1.2) skewX(10deg) skewY(-10deg);
		}
		100% {
			transform: translateX(0) scaleX(1) skewX(0deg);
		}
	}
	.current-guess {
		min-height: var(--ltr-height, 3rem);
	}

	.invalid {
		animation: shake 0.5s;
	}
	@keyframes shake {
		0% {
			transform: translate(0, 0);
		}
		10%,
		20% {
			transform: translate(-10px, 0);
		}
		30%,
		50%,
		70%,
		90% {
			transform: translate(10px, 0);
		}
		40%,
		60%,
		80% {
			transform: translate(-10px, 0);
		}
		100% {
			transform: translate(0, 0);
		}
	}
</style>
