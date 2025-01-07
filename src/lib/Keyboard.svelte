<script lang="ts">
	
    import { 
        CORRECT_L, 
        CORRECT_R, 
        CORRECT_B,
        PRESENT,
        INCORRECT, 
		CORRECT_SPLIT,
		type KEYBOARD_FEEDBACK} from "./types";    
	
	
    let {ondelete,oninput, onsubmit, lastLetter,letterFeedback} : 
        {
            ondelete: () => void,
            oninput: (ltr: string) => void,
            onsubmit: () => void,
            lastLetter: string,
            letterFeedback: {[key: string]: KEYBOARD_FEEDBACK}
        }
    = $props();
    console.log('KBD Got letter info',letterFeedback)

    let theKeyboard = [
        ['q','w','e','r','t','y','u','i','o','p'],
        ['a','s','d','f','g','h','j','k','l'],
        ['ENT','z','x','c','v','b','n','m','DEL']
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
                    class:present={letterFeedback[key] === PRESENT}
                    class:correct-left={letterFeedback[key] === CORRECT_L}
                    class:correct-right={letterFeedback[key] === CORRECT_R}
                    class:correct-left-and-right={letterFeedback[key] === CORRECT_B}
                    class:correct-split={letterFeedback[key] == CORRECT_SPLIT}
                    class:incorrect={letterFeedback[key] === INCORRECT}
                    onclick={()=>oninput(key.toLowerCase())}>{key}</button>
                {/if}
            {/each}
        </div>
    {/each}
    
    
</div>

<style>
    .keyboard {
        touch-action: manipulation;
    }    
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
        color: black;
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

    .correct-split {
        background: linear-gradient(to right, 
            var(--correct) 15%, /* Green from the left to 40% */
            var(--white) 50%,   /* White in the center from 40% to 60% */
            var(--correct) 85%  /* Green from 60% to the right */
        );
    }

    .correct-left-and-right {
        background: var(--correct);
    }
</style>

