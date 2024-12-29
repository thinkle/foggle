<script lang="ts">
	import { registerFeedback } from "./stores.svelte.ts";
	import { 
        CORRECT_L, 
        CORRECT_R, 
        CORRECT_B,
        PRESENT,
        INCORRECT } from "./types";
    import type { FEEDBACK } from "./types";        
    
    const NOANSWER = '';
    let {word, answer } = $props();
    let letters = Array.from(word);
    let hasFeedback = !!answer;
    let feedback : FEEDBACK[] = $state([]);    
    let presentPerLetter : {
        [letter : string] : number
    } = {};
    function computeFeedback () {
        for (let i = 0; i < letters.length; i++) {        
            let letter = word[i];
            let fromRight = letters.length - i;
            let answerRightIndex = answer.length - fromRight;          
            if (!answer.includes(letter)) {
                registerFeedback(letter,INCORRECT);
                feedback.push(INCORRECT);
            } else {
                let correctFromLeft = answer && answer[i] === letter;
                let correctFromRight = answer && answer[answerRightIndex] === letter;
                if (correctFromLeft && correctFromRight) {
                    registerFeedback(letter,CORRECT_B);
                    feedback.push(CORRECT_B);
                } else if (correctFromLeft) {
                    registerFeedback(letter,CORRECT_L);
                    feedback.push(CORRECT_L);
                } else if (correctFromRight) {
                    registerFeedback(letter,CORRECT_R);
                    feedback.push(CORRECT_R);
                } else {
                    // trickier logic here...
                    // there are three cases...
                    let countUnmatchedInAnswer = Array.from(answer).filter((ltr, idx) => (
                        ltr === letter &&
                        answer[idx] !== word[idx] && // Not matched from the left
                        answer[idx] !== word[word.length - (letters.length - idx)] // Not matched from the right
                    )).length;
                    if (countUnmatchedInAnswer > (presentPerLetter[letter]||0)) {
                        presentPerLetter[letter] = (presentPerLetter[letter]||0) + 1;
                        registerFeedback(letter,PRESENT);
                        feedback.push(PRESENT);
                    } else {
                        feedback.push(INCORRECT);
                    }
                }
            }
        }
    }
    if (hasFeedback) {
        computeFeedback();
    } else {
        feedback = Array(letters.length).fill(NOANSWER);
    }

</script>

<div class="wordrow">
    {#each letters as letter,i}
        <div class="letter"
            class:present={feedback[i] === PRESENT}
            class:correct-left={feedback[i] === CORRECT_L}
            class:correct-right={feedback[i] === CORRECT_R}
            class:correct-left-and-right={feedback[i] === CORRECT_B}
            class:incorrect={feedback[i] === INCORRECT}
        >{letter}</div>
    {/each}    
</div>

<style>   
:root {
    --correct: #0e6a238f;
    --present: #96ecfb5e;
    --incorrect: #6c757d;
    --white : #f1edede1;
    --ltr-height: 3rem;
    --ltr-width: 3rem;
}

.wordrow {
    display: flex;
    gap: 8px;
}

.letter {
    font-family: 'Indoor Kid Web';
    font-size: 2rem;
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
}

/* Feedback Styles */
.present {
    background: radial-gradient(circle, var(--present) 70%, transparent 100%);
    backdrop-filter: blur(2px);
}

.incorrect {        
    background: var(--incorrect);
    color: #ffffff;
    filter: brightness(0.7);
}

.correct-left {
    background: linear-gradient(to right, var(--correct) 50%, transparent 100%);
}

.correct-right {
    background: linear-gradient(to left, var(--correct) 50%, transparent 100%);
}

.correct-left-and-right {
    background: var(--correct);
}
</style>
