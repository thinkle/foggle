<script lang="ts">
	import { minWordLength } from "./stores.svelte";
	import Word from "./Word.svelte";
    
    let {word,invalid} = $props();
    let tooShort = $derived(word.length < $minWordLength);
    
    let displayWord = $derived.by(
        () => {           
            if (word.length >= $minWordLength) {
                return word;
            } else {
                let effectiveWord = word;
                while (effectiveWord.length < $minWordLength) {
                    if (effectiveWord.length + 1 === $minWordLength) {
                        effectiveWord += '…';
                    } else {
                        effectiveWord += ' ';
                    }                    
                }
                return effectiveWord;               
            }
        }
    )
    $inspect(displayWord);

</script>

<div class:invalid={invalid} class="current-guess"
    class:too-short={tooShort}
    data-tooltip={tooShort ? 'Word is at least ${minWordLength} letters long.' : ''}
>      
    {#key word}<Word word={displayWord} answer={""} /> {/key}
    {#if tooShort}<div class="hint">Word must be at least {$minWordLength} letters long!</div>{/if}
</div>

<style>
    .current-guess {
        position: relative;
    }
    .hint {
        position: absolute;
        visibility: hidden;
    }
    .current-guess:hover .hint {
    --triangle-size: 20px; /* Define the triangle size */
    --triangle-offset: 20px; /* Horizontal offset for the triangle */

    visibility: visible;        
    animation: fade-in 0.5s;        
    position: fixed;
    bottom: 30dvh;
    left: 20vw;
    font-size: 2rem;
    width: 18rem;
    background: #242;
    color: #fff; /* Ensure text is readable */
    padding: 1rem;
    border-radius: 2rem 4rem 3rem 3rem;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5); /* Optional shadow for pop */
    transform: skewX(-15deg);
    text-align: center;
}

.current-guess:hover .hint::after {
    content: '';
    position: absolute;
    bottom: calc(var(--triangle-size) * -0.8); /* Place triangle just below bubble */
    left: calc(var(--triangle-offset) * 1.5); /* Offset from left side */
    width: 0;
    height: 0;
    border-left: var(--triangle-size) solid transparent;
    border-right: var(--triangle-size) solid transparent;
    border-top: var(--triangle-size) solid #242; /* Matches bubble background */
    
}

    @keyframes fade-in {
        0% { opacity: 0; }
        100% { opacity: 1; }
    }
    .current-guess {
        min-height: var(--ltr-height,3rem);
    }
   /*  .current-guess.too-short :global(.wordrow::after) {
        content: '...';
        font-family: 'Indoor Kid Web';
       font-size: var(--font-size, 2rem);
       font-weight: bold;
       padding: 8px;
       border-radius: 8px;
       display: grid;
       place-content: center;
       text-align: center;
       width: var(--ltr-width);
       height: var(--ltr-height);
       background: radial-gradient(circle, var(--white) 70%, transparent 100%);
       text-shadow: 2px 2px 3px rgba(255, 255, 255, 0.644);
       color: #224;
       box-sizing: border-box;
    } */
    .invalid {
        animation: shake 0.5s;        
    }
@keyframes shake {
    0% { transform: translate(0, 0); }
    10%, 20% { transform: translate(-10px, 0); }
    30%, 50%, 70%, 90% { transform: translate(10px, 0); }
    40%, 60%, 80% { transform: translate(-10px, 0); }
    100% { transform: translate(0, 0); }
}
</style>

