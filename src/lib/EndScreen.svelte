<script lang="ts">
	import SpeechBubble from './SpeechBubble.svelte';
	import type { ComputedFeedback } from './types.ts';
	import Word from './Word.svelte';
    import type {FEEDBACK} from './types.ts';
	const {
		theWord,
		guesses,
		feedback,
		victory,
		onPlayAgain
	}: {
		theWord: string;
		guesses: string[];
		feedback: ComputedFeedback;
		victory: boolean;
		onPlayAgain: () => void;
	} = $props();

	const getExpression = (theWord, positive) => {
		let positiveExpressions = [
			'Wow',
			'Nailed it',
			'Nice one',
			'Amazing',
			'Sweeeet',
			'Yowzers',
			'Yikes',
			'Kapow',
			'Bazinga',
			'Wowza',
			'Shazam'
		];
        let negativeExpressions = [
            'Oh no',
            'Darn',
            'Oh well',
            'Bummer',
            'Oops',
            'Uh oh',
            'Oh dear',
            'Oh my'
        ];
        let wordIndex = 0;
        for (let ltr of theWord) {
            wordIndex += ltr.charCodeAt(0);
        }
        let expressions = positive ? positiveExpressions : negativeExpressions;
		return expressions[wordIndex % expressions.length];
	};

    const getClosenessExpression = (closeness : number) => {
        if (closeness > 0.85) {
            return 'were soooo close!';
        } else if (closeness > 0.7) {
            return 'really should have had it!';
        } else if (closeness > 0.5) {
            return 'were almost there!';
        } else if (closeness > 0.3) {
            return 'were closing in on it!';
        } else if (closeness > 0.15) {
            return 'getting there...';
        } else {
            return 'were not even close';
        }
    }

	let expression = $derived(getExpression(theWord, victory));

    
        
</script>

{#snippet playAgain ()}    
    <button onclick={onPlayAgain}>Play Again</button>    
{/snippet}

{#if victory}
	<!-- Victory screen! -->
	<div class="victory end-screen">
		<SpeechBubble position="left">
			<p>
				The <em>fog</em> has <em>lifted</em>!
				<br /><span class="big">{'{'}{guesses.length == 1 ? 'Bingo!' : expression}{'}'}</span>

				<br />
				{#if guesses.length == 6}
					And <em>just in time!</em>
				{:else if guesses.length == 1}
					You did it in <em>one</em>
				{:else}
					You did it in <em>{['one', 'two', 'three', 'four', 'five'][guesses.length - 1]}</em>
					guesses
					<br />
				{/if}
			</p>
			<br />{@render playAgain()}
		</SpeechBubble>
	</div>
{:else}
	<!-- Oh well screen -->
	<div class="loser end-screen">
        <SpeechBubble position="right">
            <p>
                <em>{expression}</em>
                <br />
                The word was 
                <br/><Word
                word={theWord}
                feedback={feedback.letterKnowledge as FEEDBACK[]}
                />
                <br/>the fog persists&hellip;
                <br />
                but you <em class="big">{getClosenessExpression(feedback.progress)}</em>
                
                <br/>
                {@render playAgain()}
            </p>
        </SpeechBubble>
    </div>
{/if}

<style>
    .end-screen {
		font-feature-settings:
			'ss03' on,
			'ss06' on;
	}
	.end-screen em {
		font-variation-settings: 'EMPH' 125;

		font-stretch: 105%;
	}
	.end-screen .big {
		font-variation-settings: 'EMPH' 125;
		font-weight: 700;
	}

    .victory {
		animation: roll-in 2s;
		animation-delay: 1s;
		animation-fill-mode: forwards;
		opacity: 0;
	}

    .loser {
        animation: fog-in 1s;
        animation-delay: 1s;
        animation-fill-mode: forwards;
        animation-timing-function: ease-out;
                opacity: 0;
    }

	@keyframes roll-in {
		0% {
			opacity: 0;
			transform: scale(0) translateX(-120vw) rotate(-1800deg);
		}
		100% {
			opacity: 1;
			transform: scale(1);
		}
	}

    @keyframes fog-in {
     
    0% {
        opacity: 0;
        transform: translateY(-100vh) scale(0.8) rotate(-15deg); /* Start above screen, tilted */
        filter: blur(10px);
    }
    40% {
        opacity: 1;
        transform: translateY(0) scale(1.4) skewY(20deg) rotate(15deg); /* Overshoot down and enlarge */
        filter: blur(4px);
    }
    60% {
        transform: translateY(0) scale(0.9) skewY(-15deg) rotate(-10deg); /* Bounce back smaller */
        filter: blur(2px);
    }
    75% {
        transform: translateY(0) scale(1.2) skewY(10deg) rotate(7deg); /* Slight overshoot upward */
        filter: blur(1px);
    }
    85% {
        transform: translateY(0) scale(0.95) skewY(-5deg) rotate(-3deg); /* Bounce back again */
        filter: blur(0.5px);
    }
    92% {
        transform: translateY(0) scale(1.05) skewY(2deg) rotate(1deg); /* Final small bounce */
        filter: blur(0.2px);
    }
    100% {
        transform: translateY(0) scale(1) skewY(0) rotate(0); /* Settle in place */
        filter: none;
        opacity: 1;
    }
}
    
    button {
		font-family: 'Indoor Kid Web';
		background: transparent;
		border: none;
		text-decoration: wavy underline white;
		color: white;
	}
	button:hover {
		text-shadow: 2px 2px 1px rgb(28, 53, 8);
	}
    .end-screen :global(.wordrow) {
        justify-content: center;
    }

</style>
