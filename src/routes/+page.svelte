<script lang="ts">
	
    import CurrentGuess from '../lib/CurrentGuess.svelte';
    import Keyboard from '../lib/Keyboard.svelte';
  
    import { getTheWord, isValid } from "$lib/words";
    import Word from '$lib/Word.svelte';    
  
    let theWord: string = getTheWord();
    let guesses: string[] = $state([]);
    let nextGuess: string = $state('');
    let isInvalid: boolean = $state(false);    
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
        if (isValid(nextGuess)) {
          guesses = [...guesses, nextGuess];
          nextGuess = '';
        } else {
          isInvalid = true;
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
  </script>
  
  <main>    
    <h1>Foggle</h1>
    
    <div class="justify-buttons" class:visible={guesses.reduce((acc, guess) => acc.add(guess.length), new Set()).size > 1}>
        <button onclick={() => justifyMode = 'left'}>Left</button>
        <button onclick={() => justifyMode = 'center'}>Center</button>
        <button onclick={() => justifyMode = 'right'}>Right</button>
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
  

    
  </main>
  <!-- Global Keydown Listener -->
  <svelte:window on:keydown={handleKeydown} />
  
  <style>
    h1 {
      font-family: Verdana, Geneva, Tahoma, sans-serif;
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
      background-image: url(bg.png);
      background-size: cover;
      background-position: center;
    }
    .guesses {
      display: flex;
      flex-direction: column;
      justify-content: start;
      gap: 0.5rem;
      overflow-y: auto;      
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
  </style>