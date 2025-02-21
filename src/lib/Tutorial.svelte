<script>
	import GuessArea from './GuessArea.svelte';
	import SpeechBubble from './SpeechBubble.svelte';

	let { onClose = () => {} } = $props(); // Callback for when the tutorial is closed

	const tutorialSteps = [
		{
			text: "Welcome to Foggle! It's like wordle, but you're guessing in the fog, trying to figure out both the word and its length.",
			position: 'left'
		},
		{
			text: "It's a little trickier though, so you're going to want to learn how it works. Scroll down to see the tutorial!",
			position: 'right'
		},
		{
			text: 'The basics are familiar: guess letters right, and they turn green...',
			position: 'right',
			example: {
				answer: 'foggy',
				guesses: ['funky', 'fools', 'foggy'],
				caption: "The green 'f' and 'y' show correct letters in the correct positions."
			}
		},
		{
			example: {
				answer: 'foggy',
				guesses: ['grove', 'often'],
				caption: 'Orange shows letters are present in the answer, but misplaced'
			}
		},
		{
			text: "But what happens if your guess isn't the same length as the word...",
			position: 'right'
		},
		{
			text: 'In that case, the word could match from the left...',
			position: 'left',
			example: {
				answer: 'foggy',
				guesses: ['fog', 'foggy'],
				justify: 'left'
			}
		},
		{
			text: 'Or it could match from the right...',
			position: 'right',
			example: {
				answer: 'foggy',
				guesses: ['shy', 'foggy'],
				justify: 'right'
			}
		},
		{
			text: 'Or it could match from multiple spots!',
			position: 'left',
			example: {
				answer: 'foggy',
				size: 1.5,
				guesses: ['fetchingly', 'foggy'],
				justify: 'left',
				caption: 'You can use the left/right to shift the words and see how the letters line up!'
			}
		},
		{
			text: 'Usually a solid green means you have the right length, but not always!',
			position: 'left',
			example: {
				answer: 'foggy',
				guesses: ['high', 'foggy'],
				caption:
					"'G' is solid green because it's both the third from the left and the second from the right, even though the guess length is wrong."
			}
		},
		{
			text: 'A single letter in the answer might match in two different positions in the guess!',
			position: 'right',
			example: {
				answer: 'foggy',
				size: 1.5,
				guesses: ['farfalle', 'farflung', 'foggy'],
				caption:
					"'F' is green in two places because it matches as the first from the left and the fifth from the right. Click 'left' and 'right' to see the letters line up!"
			}
		},
		{
			text: "Things can get hard to wrap your brain around when you match from both sides, especially if they're not right at the edges.",
			position: 'right',
			example: {
				answer: 'foggy',
				size: 1.3,
				guesses: ['frightful', 'regretfully', 'foggy'],
				caption: "Click the 'left' and 'right' buttons to see how this works!"
			}
		},
		{
			text: 'Finally, the game will show you blank letters showing you how long you know the answer must be based on your guesses so far.',
			position: 'left'
		},
		{
			text: "Let's say the word is 'confusion' for example...",
			position: 'right',
			example: {
				answer: 'confusion',
				size: 1.5,
				guesses: ['contagious'],
				caption:
					"After matching the 'i' and 'o' in the 7th and 8th positions, the game will show you 8 blank letters when you go to guess"
			}
		},
		{
			text: 'Sometimes the logic it a little convoluted...',
			position: 'left',
			example: {
				answer: 'comfortable',
				size: 1.5,
				guesses: ['comfort'],
				ncaption:
					'Since *all* the letters in the guess are in the answer but *not* in the right position, we know the answer must be longer than the 7 letter guess...'
			}
		},
		{
			text: 'Just like regular wordle, you get six guesses to get the word.',
			position: 'center'
		},
		{
			text: '(hint: long words will give you a lot more information!)',
			position: 'right'
		}
	];
</script>

<div class="tutorial-frame">
	<div class="tutorial">
		{#each tutorialSteps as step, i}
			<div
				class="step"
				class:left={step.position === 'left'}
				class:right={step.position === 'right'}
			>
				{#if step.text}
					<SpeechBubble position={step.position}>
						{step.text}
					</SpeechBubble>
				{/if}
				{#if step.example}
					{@const nletters = Math.max(...step.example.guesses.map((guess) => guess.length))}
					<SpeechBubble position={step.position} maxWidth={`min(85vw,${nletters * 3.5}rem)`}>
						<GuessArea
							guesses={step.example.guesses}
							theWord={step.example.answer}
							isRight={!step.example.showGuess}
							isDemo={true}
							nextGuess=""
							isInvalid={false}
							justify={step.example.justify}
							letterSize={step.example.size || 1.5}
						/>
						{#if step.example.caption}
							<p>{step.example.caption}</p>
						{/if}
					</SpeechBubble>
				{/if}
			</div>
		{/each}
		<button on:click={onClose}>Now let's play!</button>

		<button class="close-btn" on:click={onClose}>&times;</button>
	</div>
</div>

<style>
	button {
		font-size: 2rem;
		padding: 1rem 2rem;
		border-radius: 2rem;
		border: none;
		background: #ff542e;
		color: #fff;
		cursor: pointer;
		font-family: 'Indoor Kid Web';
		transition: transform 0.2s;
		margin-bottom: 30vh;
	}
	button:hover {
		transform-origin: center;
		transform: scale(1.1);
		text-decoration: wavy underline;
	}
	.tutorial-frame {
		position: fixed;
		width: 100vw;
		height: 100dvh;
		top: 0;
		left: 0;
		z-index: 3;
		background: #222222f5;
		display: grid;
		place-content: start center;
		font-family: 'Indoor Kid Web';
		overflow-y: auto;
		overflow-x: hidden;
	}
	.tutorial {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rem;
		padding: 1rem;
		max-width: 40rem;
		margin: 0 auto;
		position: relative;
	}

	.step {
		display: flex;
		margin-bottom: 10dvh;
		flex-direction: column;
		align-items: flex-start;
	}
	@supports (animation-timeline: view(block)) {
		.step {
			animation: fade-in 1s both;
			animation-timeline: view(block);
		}
	}
	.step.right {
		animation-name: fade-in-right;
	}
	.step.left {
		animation-name: fade-in-left;
	}

	.step:first-child {
		margin-top: calc(50dvh - 50%);
		--margin-bottom: 0dvh;
	}

	.caption {
		margin-top: 0.5rem;
		font-size: 0.9rem;
		color: #aaa;
	}

	.close-btn {
		font-size: 1rem;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		border: none;
		background: #444;
		color: #fff;
		cursor: pointer;
		position: fixed;
		top: 10px;
		right: 10px;
	}

	.close-btn:hover {
		background: #242;
	}
	:global(.wordrow) {
		justify-content: center;
	}

	@keyframes fade-in {
		0% {
			opacity: 0;
			transform: rotateX(90deg);
		}
		20% {
			opacity: 1;
			transform: rotateX(70deg);
		}
		40% {
			opacity: 1;
			transform: rotateX(0deg);
		}
		80% {
			opacity: 1;
			transform: rotateX(0deg);
		}
		100% {
			opacity: 0;
			transform: rotateX(90deg);
		}
	}
	@keyframes fade-in-right {
		0% {
			opacity: 0;
			transform: translateX(50vw);
		}
		25% {
			opacity: 1;
			transform: translateY(0);
		}
		75% {
			opacity: 1;
			transform: translateY(0);
		}
		100% {
			opacity: 0;
			transform: translateX(50vw);
		}
	}
	@keyframes fade-in-left {
		0% {
			opacity: 0;
			transform: translateX(-50vw);
		}
		25% {
			opacity: 1;
			transform: translateY(0);
		}
		75% {
			opacity: 1;
			transform: translateY(0);
		}
		100% {
			opacity: 0;
			transform: translateX(-50vw);
		}
	}
</style>
