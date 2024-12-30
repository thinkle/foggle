<script lang="ts">
	import Tutorial from './../lib/Tutorial.svelte';
	
    import CurrentGuess from '../lib/CurrentGuess.svelte';
    import Keyboard from '../lib/Keyboard.svelte';
  
    import { getTheWord, isValid } from "$lib/words";
    import Word from '$lib/Word.svelte';    
	import { minWordLength, resetFeedback } from '$lib/stores.svelte';
	import { onMount } from 'svelte';
  
    let theWord: string = $state(getTheWord());
    let guesses: string[] = $state([]);
    let nextGuess: string = $state('');
    let isInvalid: boolean = $state(false);
    let isRight = $derived(guesses[guesses.length - 1] === theWord);
    
    $effect(
        () => {
            if (theWord) 
                resetFeedback();
        }
    )

    let justifyMode : 'left' | 'right' | 'center' = $state('center');
    let guessContainer : HTMLDivElement;
    // Handle keydown events
    function handleKeydown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
  
      if (/^[a-z]$/.test(key)) {
        // If the key is a letter, add it to the guess
        nextGuess += key;
        isInvalid = false;
      } else if (key === 'backspace' || key === 'delete') {
        // Handle backspace or delete
        nextGuess = nextGuess.substring(0, nextGuess.length - 1);
        isInvalid = false;
      } else if (key === 'enter') {
        // Handle submit
        if (nextGuess.length >= $minWordLength) {
            if (isValid(nextGuess)) {
            guesses = [...guesses, nextGuess];
            nextGuess = '';
            } else {
            isInvalid = true;
            }
        }
      }
    }

    $effect(
        () => {
            if (guesses.length || nextGuess) {
                guessContainer.scrollTop = guessContainer.scrollHeight;
            }
        }
    )
    let showTutorial = $state(true);
    
    onMount(() => {
        if (localStorage.getItem('seenTutorial')) {
            showTutorial = false;
        }
    })
  </script>
  
  {#if showTutorial}
  <Tutorial onClose={() => {
    showTutorial = false;
    localStorage.setItem('seenTutorial', 'true');
} 
    }
    />
  {:else}
    <button class="tutorial-button" onclick={() => showTutorial = true} data-tooltip="Show Tutorial">?</button>
  {/if}
  <main>    
    <h1>Foggle</h1>
    
    <div class="justify-buttons" class:visible={guesses.reduce((acc, guess) => acc.add(guess.length), new Set()).size > 1}>
        <button onclick={() => justifyMode = 'left'}>← Left</button>
        <button onclick={() => justifyMode = 'center'}>Center</button>
        <button onclick={() => justifyMode = 'right'}>Right →</button>
    </div>
    <div class="guesses"
        bind:this={guessContainer}
        class:center={justifyMode === 'center'}
        class:left={justifyMode === 'left'}
        class:right={justifyMode === 'right'}
    >
      {#each guesses as guess}
        <Word word={guess} answer={theWord}></Word>
      {/each}
      <CurrentGuess word={nextGuess} invalid={isInvalid}></CurrentGuess>
    </div>
    <!-- Input -->
     {#if !isRight}
    <Keyboard
      oninput={(ltr: string) => {
        nextGuess += ltr;
        isInvalid = false;
      }}
      ondelete={() => {
        nextGuess = nextGuess.substring(0, nextGuess.length - 1);
        isInvalid = false;
      }}
      onsubmit={() => {
        if (isValid(nextGuess)) {
          guesses = [...guesses, nextGuess];
          nextGuess = '';
        } else {
          isInvalid = true;
        }
      }}
      lastLetter={nextGuess[nextGuess.length - 1]}
    ></Keyboard>
      <p class="spoiler">Spoiler: {theWord}</p>
      {:else}
      <div class="victory">
        <h2>🎉 You got it! 🎉</h2>
        <button onclick={() => {
            console.log('Reset!')
            resetFeedback();
            theWord = getTheWord();            
            guesses = [];
            nextGuess = '';
        }}>Play Again</button>
        </div>
      {/if}

    
  </main>
  <!-- Global Keydown Listener -->
  <svelte:window on:keydown={handleKeydown} />
  
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
    main {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-evenly;
      height: 100vh;
      width: 100vw;
      position: fixed;
      top: 0;
      left: 0;        
      padding: 1rem;
      gap: 8px;
      background-image: url("bg-comic.png");
      background-size: cover;
      background-position: center;
      font-family: "Indoor Kid Web";
      text-shadow: 2px 2px 3px rgba(10, 50, 26, 0.467);
      color: rgb(238, 237, 246);
    }
    .guesses {
      display: flex;
      flex-direction: column;
      justify-content: start;
      gap: 0.5rem;
      overflow-y: auto;      
      flex-grow: 1;
    }

    .center {
        align-items: center;
    }
    .left {
        align-items: flex-start;
    }
    .right {
        align-items: flex-end;
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
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        background: #fff8;
        padding: 1rem;
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