<script>
    import SpeechBubble from "./SpeechBubble.svelte";
    import Word from "./Word.svelte";
  
    let {onClose = () => {}} = $props(); // Callback for when the tutorial is closed
  
    const tutorialSteps = [
    {
      text: "Welcome to Foggle! You're guessing in the fog, trying to figure out both the word and its length.",
      position: "left",
    },
    {
      text: "Start by typing any word. We'll show feedback on which letters are correct and where they might fit.",
      position: "right",
      example: {
        answer: "foggy",
        guess: "funky",
        caption: "The green 'f' and 'y' show correct letters in the correct positions.",
      },
    },
    {
      text: "Next, we'll show when letters are present but in the wrong positions.",
      position: "left",
      example: {
        answer: "foggy",
        guess: "grove",
        caption: "Orange letters 'g' and 'o' are present but in the wrong positions.",
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
      position: "left",
      example: {
        answer: "foggy",
        guess: "cry",
        caption: "'Y' is green because it's in the correct position from the right.",
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
      text: "Finally, a single letter in the answer might match in two positions in the guess!",
      position: "right",
      example: {
        answer: "foggy",
        guess: "farfalle",
        caption: "'F' is green in two places because it matches as the first from the left and the fifth from the right.",
      },
    },
    {
      text: "You'll need to use both the feedback and your wits to figure it out. Good luck!",
      position: "center",
    },
];
  </script>
  <div class="tutorial-frame">
  <div class="tutorial">
    {#each tutorialSteps as step, i}
      <div class="step visible" class:left={step.position === "left"} class:right={step.position === "right"}>
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
        padding: 0.5rem 1rem;
        border-radius: 8px;
        border: none;
        background: #427dfb;
        color: #fff;
        cursor: pointer;
        font-family: 'Indoor Kid Web';
    }
    .tutorial-frame {
        position: fixed;
        width: 100vw;
        height: 100vh;
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
      flex-direction: column;
      align-items: flex-start;
      opacity: 0;
      transform: translateY(50px);
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
  
    .step.visible {
      opacity: 1;
      transform: translateY(0);
    }
  
    .example {
      margin-top: 1rem;
      padding: 1rem;
      background: #333;
      border-radius: 10px;
      text-align: center;
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
  </style>
  