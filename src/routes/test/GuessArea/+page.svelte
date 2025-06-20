<script lang="ts">
	import GuessArea from '$lib/GuessArea.svelte';

	const testCases = [
		{
			title: 'Align right long',
			theWord: 'blackberry',
			guesses: ['raspberry'],
			nextGuess: 'strawberry'
		},
		{
			title: 'Align right (veterinary/very)',
			theWord: 'berry',
			guesses: ['contrary'],
			nextGuess: 'raspberry'
		},
		{
			title: 'Align left (stupefaction/respect)',
			theWord: 'stupefaction',
			guesses: ['respect'],
			nextGuess: 'graph'
		},
		{
			title: 'Align center (level/savor)',
			theWord: 'level',
			guesses: ['savor'],
			nextGuess: 'savor'
		},
		{
			title: 'Align center (arbitrary/any)',
			theWord: 'arbitrary',
			guesses: ['any'],
			nextGuess: 'abby'
		}
	];

	let selected = 0;
	let width = 400;
</script>

<h1>GuessArea Alignment Test</h1>
<label>
	Test Case:
	<select bind:value={selected}>
		{#each testCases as tc, i}
			<option value={i}>{tc.title}</option>
		{/each}
	</select>
</label>
<label>
	Width:
	<input type="range" min="200" max="700" step="10" bind:value={width} />
	<span>{width}px</span>
</label>

<div class="guessarea-demo" style="max-width: {width}px; width: 100%; margin: 2rem auto;">
	{#key selected}
		<GuessArea
			theWord={testCases[selected].theWord}
			guesses={testCases[selected].guesses}
			nextGuess={testCases[selected].nextGuess}
			isRight={false}
			isInvalid={false}
			feedback={undefined}
			isDemo={true}
		/>
	{/key}
</div>

<style>
	h1 {
		font-family: 'Indoor Kid Web', sans-serif;
		font-size: 2rem;
		margin-bottom: 1rem;
	}
	label {
		display: block;
		margin-bottom: 1rem;
	}
	.guessarea-demo {
		background: #0e6a23db;
		border-radius: 2rem;
		box-shadow: 0 0 32px #000a;
		padding: 2rem 1.5rem;
		color: white;
		font-family: 'Indoor Kid Web', sans-serif;
		position: relative;
	}
</style>
