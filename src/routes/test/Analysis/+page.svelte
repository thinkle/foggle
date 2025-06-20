<script lang="ts">
	import Analysis from '$lib/Analysis.svelte';

	// Example test cases for the Analysis screen
	const testCases = [
		{
			title: 'Long word',
			theWord: 'counterrevolutionary',
			guesses: ['ridiculous', 'vacation', 'counter', 'counterrevolutionary']
		},
		{
			title: 'Narrowing down',
			theWord: 'discombobulated',
			guesses: ['recidivist', 'disco', 'combination', 'bobble', 'discombobulated']
		},
		{
			title: '5-4-1',
			theWord: 'bade',
			guesses: ['lemonade', 'wade', 'jade', 'chaff', 'bade']
		}
	];

	let selected = 0;
</script>

<!-- Ensure base font and global styles are loaded for this test harness -->
<link rel="stylesheet" href="/fonts.css" />
<link rel="stylesheet" href="/global.css" />

<h1>Analysis Test Harness</h1>
<label>
	Test Case:
	<select bind:value={selected}>
		{#each testCases as tc, i}
			<option value={i}>{tc.title}</option>
		{/each}
	</select>
</label>

<div class="analysis-demo-bubble">
	{#key selected}
		<Analysis guesses={testCases[selected].guesses} theWord={testCases[selected].theWord} />
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
	.analysis-demo-bubble {
		background: #0e6a23db;
		border-radius: 2rem;
		box-shadow: 0 0 32px #000a;
		padding: 2rem 1.5rem;
		max-width: 600px;
		margin: 2rem auto;
		color: white;
		font-family: 'Indoor Kid Web', sans-serif;
		position: relative;
	}
</style>
