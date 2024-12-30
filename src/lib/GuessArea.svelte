<script lang="ts">
	
	
    import CurrentGuess from './CurrentGuess.svelte';          
    
    import Word from '$lib/Word.svelte';    
	import { letterFeedback } from '$lib/stores.svelte';
	import { onMount } from 'svelte';
	import { CORRECT_L, CORRECT_R } from '$lib/types';
	
    let {theWord, guesses, nextGuess, isRight, isInvalid, justify = undefined, isDemo = false, letterSize = undefined} = $props();
    
    let sizeAdjust = $derived.by(
        () => {
            if (letterSize) return letterSize;
            let maxGuessLength = nextGuess.length;
            for (let guess of guesses) {
                maxGuessLength = Math.max(maxGuessLength, guess.length);
            }
            if (maxGuessLength > 9) {
                return 1.5;
            } else if (maxGuessLength > 7) {
                return 1.8;
            } else if (maxGuessLength > 5) {
                return 2;
            } else {
                return 3;
            }
        }
        
    )


    let justifyMode : 'left' | 'right' | 'center' = $state(justify||'center');
    let guessContainer : HTMLDivElement;
    // Handle keydown events
   
    $effect(
        () => {
            let rightCount = 0;
            let leftCount = 0;
            for (let ltr in $letterFeedback) {
                if ($letterFeedback[ltr] === CORRECT_R) {
                    rightCount++;
                } else if ($letterFeedback[ltr] === CORRECT_L) {
                    leftCount++;
                }
            }
            if (rightCount > leftCount) {
                justifyMode = 'right';
            } else if (leftCount > rightCount) {
                justifyMode = 'left';
            }
        }
    )

    $effect(
        () => {
            if (guesses.length || nextGuess) {
                guessContainer.scrollTop = guessContainer.scrollHeight;
            }
        }
    )
    
    $effect(
        () => {
            if (guesses.length || nextGuess) {
                guessContainer.scrollTop = guessContainer.scrollHeight;
            }
        }
    )

  </script>
<div class="justify-buttons" class:visible={guesses.reduce((acc, guess) => acc.add(guess.length), new Set()).size > 1}>
        <button class:active={justifyMode=='left'} onclick={() => justifyMode = 'left'}>← Left</button>
        <button class:active={justifyMode=='center'} onclick={() => justifyMode = 'center'}>Center</button>
        <button class:active={justifyMode=='right'} onclick={() => justifyMode = 'right'}>Right →</button>
    </div>
    <div class="guesses"
        bind:this={guessContainer}
        class:center={justifyMode === 'center'}
        class:left={justifyMode === 'left'}
        class:right={justifyMode === 'right'}
        style:--font-size="{sizeAdjust}rem"
    >
      {#each guesses as guess}
        <Word word={guess} answer={theWord} {isDemo}></Word>
      {/each}
      {#if !isRight}
      <CurrentGuess word={nextGuess} invalid={isInvalid}></CurrentGuess>
    {/if}
  </div>
<style>         

    button {
        font-family: "Indoor Kid Web";
        background: transparent;
        border: none;
        text-decoration: wavy underline white;
        color: white;        
    }
    button:hover {
        text-shadow: 2px 2px 1px rgb(28, 53, 8);
    }
    button.active:hover {
        text-shadow: none;
    }
    .justify-buttons button {
        text-decoration: none;
    }
    .justify-buttons button.active {
        text-decoration: wavy underline white;
    }
    
    .guesses {
      display: flex;
      flex-direction: column;
      justify-content: start;
      gap: 0.5rem;
      overflow-y: auto;      
      flex-grow: 1;
      min-width: min(100vw,15rem);
    }

    .center {
        align-items: center;
    }
    .center :global(.wordrow) {
        justify-content: center;
    }
    .left {
        align-items: flex-start;
    }
    .left :global(.wordrow) {
        justify-content: start;
    }
    .right {
        align-items: flex-end;
    }
    .right :global(.wordrow) {
        justify-content: end;
    }
    .justify-buttons {
        opacity: 0;
        transition: opacity 0.5s;
    }
    .justify-buttons.visible {
        opacity: 1;
    }
    .spoiler {
        border: 1px solid #333;
        color: transparent;
        font-weight: bold;
        font-size: 12px;
        position: absolute;
        right: 1rem;
        bottom: 1rem;
    }
    .spoiler:hover {
        color: orange;
        
    }
    .victory {        
        animation: roll-in 1s;
    }
    @keyframes roll-in {
        0% {
            transform: scale(0)translateX(-100%)rotate(-1800deg);
        }
        100% {
            transform: scale(1);
        }
    }
    .tutorial-button {
        position: fixed;
        top: 1rem;
        right: 1rem;
        font-size: 2rem;
        background: transparent;
        border: none;
        color: white;
        text-shadow: 2px 2px 3px rgba(10, 50, 26, 0.467);
        z-index: 99;
        text-decoration: none;
        width: 3rem;
        height: 3rem;
    }
    .tutorial-button:hover {
        background: #222;
        border-radius: 50%;
    }
  </style>

