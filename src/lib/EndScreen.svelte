<script lang="ts">
	import SpeechBubble from './SpeechBubble.svelte';
	import type { ComputedFeedback } from './types.ts';
	import Word from './Word.svelte';
    import type {FEEDBACK} from './types.ts';
	import { hasCompletedDaily, type PuzzleType } from './gameInProgress';
	import { getDayIndex } from '../wordlists/magicNumber';
	import Analysis from './Analysis.svelte';
    
	const {
		theWord,
		guesses,
		feedback,
		victory,
		onPlayAgain,
        mode
	}: {
		theWord: string;
		guesses: string[];
		feedback: ComputedFeedback;
		victory: boolean;
        mode : PuzzleType
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
            return 'were getting there...';
        } else {
            return 'were not even close';
        }
    }

	let expression = $derived(getExpression(theWord, victory));
    let showAnalysis = $state(false);
    let analysisDialog : HTMLDialogElement | undefined = $state();
    $effect(
        () => {
            if (analysisDialog && showAnalysis) {
                analysisDialog.showModal();
            }
        }
    )
</script>

{#snippet analysis ()}
  {#if guesses.length > 1} 
    <a class="analysis-cta" onclick={() => showAnalysis = !showAnalysis}>
        {showAnalysis ? 'Hide' : 'Show'} Analysis</a>
    {#if showAnalysis}
        <dialog bind:this={analysisDialog}>
            <button class="close" onclick="{() => showAnalysis = false}">&times;</button>
            <Analysis guesses={guesses} theWord={theWord} feedback={feedback} />
        </dialog>
    {/if}
  {/if}
{/snippet}

{#snippet playAgain ()}    
{#if mode === 'daily'}
    <p>There will be a new daily puzzle tomorrow!</p>
    <button onclick={onPlayAgain}>Play Unlimited Mode</button>    
{:else}
    {#if !hasCompletedDaily(getDayIndex())}
        <p>You haven't played today's puzzle yet!!!</p>
        <button onclick={onPlayAgain}>Play Daily Puzzle!</button>
    {:else}
        <button onclick={onPlayAgain}>Play Another?</button>
    {/if}
{/if}
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
            {@render analysis()}
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
                {@render analysis()}
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
    dialog::backdrop {
        background: rgba(0, 0, 0, 0.8);
    }
    dialog {
        background: transparent;
    }
    dialog .close {
        position: fixed;
        top: 8px;
        right: 8px;
        text-decoration: none;
    }
    .analysis-cta {
        margin: 1rem auto;
        display: block;
        font-size: small;
    }
</style>
