<script lang="ts">
    import GuessArea from '../lib/GuessArea.svelte';

	import Tutorial from './../lib/Tutorial.svelte';
	
    
    import Keyboard from '../lib/Keyboard.svelte';
  
    import { getTheWord, isValid } from "$lib/words";
    import Word from '$lib/Word.svelte';    
	import { minWordLength, resetFeedback } from '$lib/stores.svelte';
	import { onMount } from 'svelte';
	import SpeechBubble from '$lib/SpeechBubble.svelte';

    const getExpression = () => {
        let expressions = ['Wow','Nailed it','Nice one','Amazing','Sweeeet',
            'Yowzers','Yikes','Kapow','Bazinga','Bingo','Shazam',
        ]
        return expressions[Math.floor(Math.random() * expressions.length)];
    }

    let expression = $state(getExpression());
    let theWord: string = $state(getTheWord());
    let guesses: string[] = $state([]);
    let nextGuess: string = $state('');
    let isInvalid: boolean = $state(false);
    let isRight = $derived(guesses[guesses.length - 1] === theWord);
    
    $effect(
        () => {
            if (theWord) 
                resetFeedback();
                expression = getExpression();
        }
    )
    $inspect(isRight,guesses,nextGuess)

    
    
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
    <h1>Fo<span class="g">g</span>gle</h1>
    
    <GuessArea
        {theWord}
        {guesses}
        {isInvalid}
        {isRight}
        {nextGuess}
    ></GuessArea>
    {#if guesses.length == 6 && !isRight}
    <Word word={theWord} answer={theWord} isDemo={true}></Word>
    {/if}
    {#if !isRight && guesses.length >= 6}
    <button onclick={() => {
        console.log('Reset!')
        resetFeedback();
        theWord = getTheWord();            
        guesses = [];
        nextGuess = '';
    }}>Play Again</button>
    {/if}
    <!-- Input -->
     {#if !isRight && guesses.length < 6}
     {theWord}
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
      
      {:else if isRight}
      
      <div class="victory">
        <SpeechBubble>
            <h2>{"{"}{expression}{"}"}</h2>
            <p>The fog has lifted!</p>
            <button onclick={() => {
                console.log('Reset!')
                resetFeedback();
                theWord = getTheWord();            
                guesses = [];
                nextGuess = '';
            }}>Play Again</button>
        </SpeechBubble>
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
      height: 100dvh;
      width: 100vw;
      position: fixed;
      top: 0;
      left: 0;        
      padding: 1rem;
      gap: 8px;
      background-image: url("/bg-comic.png");
      background-size: cover;
      background-position: center;
      font-family: "Indoor Kid Web";
      text-shadow: 2px 2px 3px rgba(10, 50, 26, 0.467);
      color: rgb(238, 237, 246);
    }    
    .victory {        
        animation: roll-in 2s;
        animation-delay: 1s;
        animation-fill-mode: forwards;
        opacity: 0;
    }
    @keyframes roll-in {
        0% {
            opacity: 0;
            transform: scale(0)translateX(-120vw)rotate(-1800deg);
        }
        100% {
            opacity: 1;
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
h2 {
    font-variation-settings: 'EMPH' 125;
  font-weight: 700;
  font-stretch: 105%;
  font-style: oblique 20deg;
  font-feature-settings: "ss03" on;  
}
h1 {
        margin: 0;
        font-size: 2rem;
        font-stretch: 130%;
        font-weight: 100;
        letter-spacing: 0px;
        text-shadow: 3px 3px 1px rgba(4, 23, 12, 0.8);
        -webkit-text-stroke: 1px rgb(218, 248, 231);
    }
    .g {
        letter-spacing: -4px;
    }
    @media (min-width: 1080px) {
        h1 {
            font-size: 3rem;
            margin: 0.5rem;
        }
        
    }
    @media (max-width: 800px) {
        h1 {
            font-size: 1.5rem;
            margin: 0;
        }
        .tutorial-button {
            top: 0.5rem;
        }
        
    }
    @media (max-width: 460px) {
        :root,main {
            font-size: 13px;
        }
    }
  </style>