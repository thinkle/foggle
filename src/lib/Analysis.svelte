<script>
	import { getPossibleWords } from './foggleBot';
	import SpeechBubble from './SpeechBubble.svelte';
	import { CORRECT_B } from './types';
	import Word from './Word.svelte';
	import { computeFeedback } from './wordFeedback';

	let { guesses, theWord, feedback: feedbackProp = null } = $props();
	let feedback = $derived(feedbackProp ?? computeFeedback(guesses, theWord));
	let step = $state(1);
	let possibleWordsPerGuess = $derived(
		guesses.map((g, i) => getPossibleWords(guesses.slice(0, i + 1), theWord))
	);
	let feedbackPerGuess = $derived(
		guesses.map((g, i) => computeFeedback(guesses.slice(0, i + 1), theWord))
	);
	let ordinals = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Last'];
	let final = 'Last';
	let showAllWords = $state(Array(guesses.length).fill(false));
</script>

<div class="analysis">
	{#snippet template(word, expanded)}
		{@const letters = word.length - (word.split('?').length - 1)}
		{#if letters > 1}
			{#if expanded}
				a shortest possible pattern of
			{/if}
			<Word {word} answer={null} />
			and
		{/if}
	{/snippet}
	<SpeechBubble position="right">
		The word was:
		<Word
			word={theWord}
			answer={theWord}
			feedback={Array.from(theWord).map((l) => CORRECT_B)}
		/>
		Let's break down how we got there...
	</SpeechBubble>
	{#each guesses as guess, i}
		{@const nwords = possibleWordsPerGuess[i].length}
		<SpeechBubble
			position={i % 2 == 0 ? 'right' : 'left'}
			skew={showAllWords[i] ? 1 : undefined}
		>
			{#if guesses[i] === theWord}
				<div class="blurb">
					And on your {ordinals[i]} guess, you got it!
				</div>
			{:else}
				<div class="blurb">
					Your
					{#if i == guesses.length - 1}
						{final}
					{:else}
						{ordinals[i]}
					{/if}
					guess was:
					<Word word={guesses[i]} answer={theWord} feedback={feedback.guessFeedback[i]} />
					{#if feedbackPerGuess[i].template !== feedbackPerGuess[i - 1]?.template || possibleWordsPerGuess[i].length !== possibleWordsPerGuess[i - 1]?.length}
						{#if i == 0}
							<br />After that guess, you were down to {@render template(
								feedbackPerGuess[i].template,
								true
							)}
							<span>{possibleWordsPerGuess[i].length} words</span>
							remaining that could fit the pattern{#if nwords == 1 || nwords > 5}.{:else}:{/if}
						{:else if i < guesses.length - 1}
							leaving
							{@render template(feedbackPerGuess[i].template)}
							<br /><span
								>{possibleWordsPerGuess[i].length}
								{#if possibleWordsPerGuess[i].length > 1}words{:else}word{/if}{#if nwords == 1 || nwords > 5}.{:else}:{/if}</span
							>
						{/if}
					{/if}
				</div>
				{#if possibleWordsPerGuess[i].length !== possibleWordsPerGuess[i - 1]?.length}
					{#if nwords > 1 && nwords <= 5}
						{#each possibleWordsPerGuess[i] as word, j}
							<span class="word">{word}</span
							>{#if j == nwords - 2}&nbsp;and&nbsp;{:else if j < nwords - 1},
							{/if}
						{/each}
					{:else if nwords < 201 && nwords > 5}
						<button onclick={() => (showAllWords[i] = !showAllWords[i])}>
							{showAllWords[i] ? 'Hide' : 'Show'} all {nwords} words
						</button>
						{#if showAllWords[i]}
							<div class="word-grid">
								{#each possibleWordsPerGuess[i] as word}
									<span class="word">{word}</span>
								{/each}
							</div>
						{/if}
					{/if}
				{/if}
			{/if}
		</SpeechBubble>
	{/each}
</div>

<style>
	.analysis :global(.wordrow) {
		justify-content: center;
	}
	.blurb {
		max-width: 18em;
		text-align: center;
	}
	.blurb,
	.blurb span,
	.blurb .word {
		text-align: center;
	}
	div {
		--font-size: 1rem;
		--ltr-height: 1.5rem;
		--ltr-width: 1.2rem;
		font-feature-settings:
			'ss03' on,
			'ss06' on;
		font-variation-settings: 'EMPH' 85;
	}
	div span {
		font-variation-settings: 'EMPH' 125;
	}
	span.word {
		font-variation-settings:
			'EMPH' 100,
			'SLANT' 0;
		font-style: normal;
		display: inline-block;
		white-space: normal;
		word-break: break-word;
		overflow-wrap: break-word;
	}
	button {
		background: none;
		border: none;
		color: white;
		font-family: inherit;
		display: block;
		margin: auto;
	}
	.word-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
		gap: 0.5rem;
	}
	.word-grid .word {
		font-size: x-small;
	}
	.template {
		font-variation-settings:
			'EMPH' 100,
			'SLANT' 0;
		font-style: normal;
		text-decoration: underline;
	}
	div {
		text-align: center;
		margin: auto;
	}
</style>
