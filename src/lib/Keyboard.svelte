<script lang="ts">
    import { 
        CORRECT_L, 
        CORRECT_R, 
        CORRECT_B,
        PRESENT,
        INCORRECT } from "./types";    
	
	import { letterFeedback } from "./stores.svelte";
    let {ondelete,oninput, onsubmit, lastLetter} = $props();

    let theKeyboard = [
        ['Q','W','E','R','T','Y','U','I','O','P'],
        ['A','S','D','F','G','H','J','K','L'],
        ['ENT','Z','X','C','V','B','N','M','DEL']
    ];
</script>

<div class="keyboard">
    {#each theKeyboard as row}
        <div class="row">
            {#each row as key}
                {#if key === 'ENT'}
                    <button onclick={onsubmit}>⏎ </button>                                
                {:else if key == 'DEL'} 
                    <button onclick={ondelete}>⌫</button>
                {:else}
                <button
                    class:just-typed={key.toLowerCase()==lastLetter}
                    class:present={$letterFeedback[key] === PRESENT}
                    class:correct-left={$letterFeedback[key] === CORRECT_L}
                    class:correct-right={$letterFeedback[key] === CORRECT_R}
                    class:correct-left-and-right={$letterFeedback[key] === CORRECT_B}
                    class:incorrect={$letterFeedback[key] === INCORRECT}
                    onclick={()=>oninput(key.toLowerCase())}>{key}</button>
                {/if}
            {/each}
        </div>
    {/each}
    
    
</div>

<style>

    

    .row {
        display: flex;
        justify-content: center;
        /* worst case...*/
        flex-wrap: wrap;
    }

    button {
        box-sizing: border-box;
        font-size: 2rem;
        font-weight: bold;        
        padding: 8px;
        border-radius: 8px;
        display: grid;
        place-content: center;
        text-align: center;
        /* Adjust width to fit 10 keys */
        width: min(calc((100vw - 3rem) / 10),4rem);
        height: 3.5rem;
        background: radial-gradient(circle, var(--white) 70%, transparent 100%);
        border: 3px solid #222a;
        transition: border-color 0.3s;
        font-family: "Indoor Kid Web";
        font-stretch: 130%;
        font-weight: 900;
    }
    button.just-typed {
        border-color: rgba(247, 126, 13, 0.852);
    }
    /* Feedback Styles */
    .present {
        background: radial-gradient(circle, var(--present) 70%, transparent 100%);
        backdrop-filter: blur(2px);
    }

    .incorrect {        
        background: var(--incorrect);
        color: #ccc;
        filter: brightness(0.7);
    }

    .correct-left {
        background: linear-gradient(to right, var(--correct) 40%, var(--white) 60%);
    }

    .correct-right {
        background: linear-gradient(to left, var(--correct) 40%, var(--white) 60%);
    }

    .correct-left-and-right {
        background: var(--correct);
    }
</style>

