<script>
    import SpeechBubble from "./SpeechBubble.svelte";
    import Word from "./Word.svelte";
  
    let {onClose = () => {}} = $props(); // Callback for when the tutorial is closed
  
    const tutorialSteps = [
    {
      text: "Welcome to Foggle! It's like wordle, but you're guessing in the fog, trying to figure out both the word and its length.",
      position: "left",
    },
    {
      text: "The basics are familiar: guess letters right, and they turn green...",
      position: "right",
      example: {
        answer: "foggy",
        guess: "funky",
        caption: "The green 'f' and 'y' show correct letters in the correct positions.",
      },
    },
    {      
      example: {
        answer: "foggy",
        guess: "grove",
        caption: "Orange shows letters are present in the answer, but misplaced"
      },
    },
    {
      text: "But what happens if your guess isn't the same length as the word...",
      position: "right",
    },
    {
      text: "In that case, the word could match from the left or the right...",
      position: "left",
      example: {
        answer: "foggy",
        guess: "fog",
        caption: "'F', 'o', and 'g' match correctly from the left.",
      },
    },
    {      
      position: "right",
      example: {
        answer: "foggy",
        guess: "shy",
        caption: "And 'Y' matches from the right.",
      },
    },          
    {
      text: "Usually a solid green means you have the right length, but not always!",
      position: "left",
      example: {
        answer: "foggy",
        guess: "high",
        caption: "'G' is solid green because it's both the third from the left and the second from the right, even though the guess length is wrong.",
      },
    },
    {
      text: "A single letter in the answer might match in two different positions in the guess!",
      position: "right",
      example: {
        answer: "foggy",
        guess: "farfalle",
        caption: "'F' is green in two places because it matches as the first from the left and the fifth from the right.",
      },
    },
    {
        text: "Finally, the game will limit you to guesses at least as long as you know the answer might be.",
        position: "left"
    },
    {
        text: "Let's say the word is 'confusion' for example...",
        position: "right",
        example : {
            "answer" : "confusion",
            "guess" :  "contagious",
            "caption" : "After matching the 'i' and 'o' in the 7th and 8th positions, the game will make you guess at least 8 letters.",
        }
    },
    {
        text : "If you haven't typed a long enough word, it will show a ... to indicate you need more letters. Move your mouse over the ... to see the minimum length your word could be based on the feedback you've gotten so far!",
        position: 'left'
    },
    {
      text: "We're still in testing phase, so I haven't figured out how many guesses to give you so far. But I hope you enjoy the game!",
      position: "center",
    },
    {
        text: "(If you get frustrated, there's a hidden box in the top left that will reveal the answer)",
        position: "right",
    }
];
  </script>
  <div class="tutorial-frame">
  <div class="tutorial">
    {#each tutorialSteps as step, i}
      <div class="step" class:left={step.position === "left"} class:right={step.position === "right"}>
        {#if step.text}
        <SpeechBubble position={step.position}>
          {step.text}
        </SpeechBubble>
        {/if}
        {#if step.example}
          <SpeechBubble position={step.position} >
            <div class="caption">If the answer is: <b>{step.example.answer}</b>
                </div>
            <Word isDemo={true} answer={step.example.answer} word={step.example.guess} />
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
      animation: fade-in 1s both;
      animation-timeline: view(block);      
    }
    .step.right {
        animation-name: fade-in-right;
    }
    .step.left {
        animation-name: fade-in-left;
    }
       
    .step:first-child {
        margin-top: calc(50dvh - 50%);
        margin-bottom: 50dvh;
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
  