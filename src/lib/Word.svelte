<script lang="ts">
import {
    minWordLength,
    registerFeedback
} from "./stores.svelte";
import {
    CORRECT_L,
    CORRECT_R,
    CORRECT_B,
    PRESENT,
    INCORRECT
} from "./types";
import type {
    FEEDBACK
} from "./types";

const NOANSWER = '';
let {
    word,
    answer,
    isDemo = false
} = $props();
let letters = Array.from(word);
let hasFeedback = !!answer;
let feedback: FEEDBACK[] = $state([]);
let presentPerLetter: {
    [letter: string]: number
} = {};

function computeFeedback() {    
    for (let i = 0; i < letters.length; i++) {
        let letter = word[i];
        let fromRight = letters.length - i;
        let answerRightIndex = answer.length - fromRight;
        if (!answer.includes(letter)) {
            if (!isDemo) registerFeedback(letter, INCORRECT);
            feedback.push(INCORRECT);
        } else {
            let correctFromLeft = answer && answer[i] === letter;
            let correctFromRight = answer && answer[answerRightIndex] === letter;
            if (correctFromLeft && correctFromRight) {
                if (!isDemo) registerFeedback(letter, CORRECT_B);
                feedback.push(CORRECT_B);
            } else if (correctFromLeft) {
                if (!isDemo) registerFeedback(letter, CORRECT_L);
                feedback.push(CORRECT_L);
            } else if (correctFromRight) {
                if (!isDemo) registerFeedback(letter, CORRECT_R);
                feedback.push(CORRECT_R);
            } else {
                // trickier logic here...
                // there are three cases...
                let countUnmatchedInAnswer = Array.from(answer).filter((ltr, idx) => (
                    ltr === letter &&
                    answer[idx] !== word[idx] && // Not matched from the left
                    answer[idx] !== word[word.length - (answer.length - idx)] // Not matched from the right
                )).length;
                console.log('There are ', countUnmatchedInAnswer, ' unmatched ',letter,'in answer');
                if (countUnmatchedInAnswer > (presentPerLetter[letter] || 0)) {
                    presentPerLetter[letter] = (presentPerLetter[letter] || 0) + 1;
                    console.log('Going ahead and marking this one PRESENT');
                    if (!isDemo) registerFeedback(letter, PRESENT);
                    feedback.push(PRESENT);
                } else {
                    feedback.push(INCORRECT);
                }
            }
        }
    }
    // Infer the minmum length based on feedback...
    let usedIndices = new Set(); // Track matched indices in the answer

    let nLetters = feedback.reduce((count, f, i) => {
        if ([CORRECT_L, CORRECT_R, CORRECT_B, PRESENT].includes(f)) {
            // Find the index of the letter in the answer
            let letter = word[i];
            let matchIndex = answer.indexOf(letter);

            // Ensure we haven't already used this letter's match
            while (usedIndices.has(matchIndex) && matchIndex !== -1) {
                matchIndex = answer.indexOf(letter, matchIndex + 1); // Find next occurrence
            }

            if (matchIndex !== -1) {
                usedIndices.add(matchIndex); // Mark this index as used
                return count + 1; // Count the letter
            }
        }
        return count; // Otherwise, don't increment the count
    }, 0);
    let leftmostRight = Math.max(feedback.indexOf(CORRECT_R), feedback.indexOf(CORRECT_B));
    let rightmostLeft = Math.max(feedback.lastIndexOf(CORRECT_L), feedback.lastIndexOf(CORRECT_B));
    if (leftmostRight > -1) {
        nLetters = Math.max(nLetters, letters.length - leftmostRight);
    }
    if (rightmostLeft > -1) {
        nLetters = Math.max(nLetters, rightmostLeft + 1);
    }
    if (nLetters > $minWordLength) {
        if (!isDemo) $minWordLength = nLetters;
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
    --correct: #0e6a23db;
    --present: #ea842bc2;
    --incorrect: #6c757d;
    --white: #f1edede1;
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
    color: #224;
    box-sizing: border-box;
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
    background: linear-gradient(to right, var(--correct) 40%, var(--incorrect) 60%);
}

.correct-right {
    background: linear-gradient(to left, var(--correct) 40%, var(--incorrect) 60%);
}

.correct-left-and-right {
    background: var(--correct);
    border: 3px solid var(--correct);
}
</style>
