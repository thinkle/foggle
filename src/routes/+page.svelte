<script lang="ts">
	import { type SavedGame, setSavedGame, getSavedGame } from './../lib/gameInProgress';	
    import GuessArea from '../lib/GuessArea.svelte';

	import Tutorial from './../lib/Tutorial.svelte';
	    
    import Keyboard from '../lib/Keyboard.svelte';

    import { getRandomWord, isValid } from "$lib/words";
    import Word from '$lib/Word.svelte';    	
	import { onMount } from 'svelte';
	import SpeechBubble from '$lib/SpeechBubble.svelte';	
	import { computeFeedback } from '$lib/wordFeedback';

    const getExpression = () => {
        let expressions = ['Wow','Nailed it','Nice one','Amazing','Sweeeet',
            'Yowzers','Yikes','Kapow','Bazinga','Wowza','Shazam',
        ]
        return expressions[Math.floor(Math.random() * expressions.length)];
    }

    let expression = $state(getExpression());
    let theWord: string = $state(getRandomWord());
    let guesses: string[] = $state([]);
    let nextGuess: string = $state('');
    let isInvalid: boolean = $state(false);
    let isRight = $derived(guesses[guesses.length - 1] === theWord);
    let initialized = $state(false);
    let playedDaily : boolean = $state(false);
    let mode : 'daily' | 'extra' = $state('extra');
    // feedback object
    let feedback = $derived(computeFeedback(guesses,theWord));
    // shorthand
    let {
        letterFeedback,
        progress,
        minWordLength,
        letterKnowledge,
    } = $derived(feedback);
    $inspect('Updating letter feedback',letterFeedback)
    onMount(() => {
        console.log('Running onMount!');        
        const savedGame = getSavedGame();
        if (savedGame) {
            console.log('Loading saved game...');
            theWord = savedGame.currentWord;
            guesses = savedGame.guesses;
        }        
        initialized = true;
    })

    $effect(
        () => {
            if (initialized) {
                setSavedGame({
                    currentWord: theWord,
                    guesses: guesses,
                    puzzleType: 'extra', // fix me
                    puzzleId: 0, // fix me
                });
            }
        }
    )
    
    
    let titleFilter = $derived.by(
        ()=>{
            if (isRight || guesses.length == 0) {
                return 'none';
            } else {
                let blur = 4 * (1 - progress);
                return `blur(${blur}px)`;
            }
        }
    )    

    $effect(
        () => {
            if (theWord) 
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
        if (nextGuess.length >= minWordLength) {
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
    <h1 style:--title-filter={titleFilter}>Fo<span class="g">g</span>gle</h1>
    
    <GuessArea
        {theWord}
        {guesses}
        {isInvalid}
        {isRight}
        {nextGuess}
        {feedback}
    ></GuessArea>
    {#if guesses.length == 6 && !isRight}
    <Word word={theWord} answer={theWord} isDemo={true}></Word>
    {/if}
    {#if !isRight && guesses.length >= 6}
    <button onclick={() => {
        console.log('Reset!')
        theWord = getRandomWord();            
        guesses = [];
        nextGuess = '';
    }}>Play Again</button>
    {/if}
    <!-- Input -->     
     {#if !isRight && guesses.length < 6}     
    <Keyboard
      letterFeedback = {letterFeedback}
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
        <SpeechBubble position="left">
            <p>
                The <em>fog</em> has <em>lifted</em>!
                <br><span class="big">{"{"}{guesses.length==1 ? "Bingo!" : expression}{"}"}</span>
                
                <br>
                {#if guesses.length == 6}
                    And <em>just in time!</em>
                {:else if guesses.length == 1}
                    You did it in <em>one</em>
                {:else}
                    You did it in <em>{['one','two','three','four','five'][guesses.length - 1]}</em> guesses
                <br/>
                {/if}
            </p>
            <br/><button onclick={() => {
                console.log('Reset!')
                theWord = getRandomWord();            
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
    .victory {
        font-feature-settings: "ss03" on, "ss06" on;  
    }
.victory em {
    font-variation-settings: 'EMPH' 125;
  
  font-stretch: 105%;    
}
.victory .big {
    font-variation-settings: 'EMPH' 125;
    font-weight: 700;
}
h1 {
        margin: 0;
        font-size: 2rem;
        font-stretch: 130%;
        font-weight: 100;
        letter-spacing: -.1em;
        /* Use text shadow to do an outline in addition to our shadow */
        text-shadow: -1px -1px 0px rgba(4, 23, 12, .8), 1px 1px 0px rgba(4, 23, 12, .8), -1px 1px 0px rgba(4, 23, 12, .8), 1px -1px 0px rgba(4, 23, 12, 0.8),6px 6px 6px rgb(25, 78, 47);
        filter: var(--title-filter);
    }
    .g {
        letter-spacing: -0.3em;
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