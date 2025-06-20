<script lang="ts">
	// List of test harnesses for manual QA
	const tests = [
		{ name: 'Analysis', path: '/test/Analysis' },
		{ name: 'GuessArea', path: '/test/GuessArea' }
		// Add more test harnesses here as you create them
	];
</script>

<h1>Foggle Test Harnesses</h1>
<ul>
	{#each tests as test}
		<li><a href={test.path}>{test.name} Test</a></li>
	{/each}
</ul>

<style>
	h1 {
		font-family: 'Indoor Kid Web', sans-serif;
		font-size: 2rem;
		margin-bottom: 1rem;
		text-align: center;
	}
	ul {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rem;
		margin-top: 2rem;
	}
	li {
		margin-bottom: 0;
	}
	a {
		color: #0e6a23;
		background: #fff;
		border-radius: 1rem;
		padding: 1.25rem 2.5rem;
		font-family: 'Indoor Kid Web', sans-serif;
		font-size: 1.4rem;
		text-decoration: none;
		box-shadow: 0 0 16px #0002;
		transition:
			background 0.2s,
			color 0.2s,
			transform 0.1s;
		display: inline-block;
	}
	a:hover {
		background: #0e6a23;
		color: #fff;
		transform: scale(1.05);
	}
</style>
