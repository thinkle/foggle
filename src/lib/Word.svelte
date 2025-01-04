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
    feedback
} : {
    word : string,
    answer : string,
    feedback : FEEDBACK[] | undefined
} = $props();
let letters = Array.from(word);
let hasFeedback = !!feedback;


</script>

<div class="wordrow" class:no-feedback={!hasFeedback}>
    {#each letters as letter,i}
    <div class="letter"
        class:present={feedback && feedback[i] === PRESENT}
        class:correct-left={feedback && feedback[i] === CORRECT_L}
        class:correct-right={feedback && feedback[i] === CORRECT_R}
        class:correct-left-and-right={feedback && feedback[i] === CORRECT_B}
        class:incorrect={feedback && feedback[i] === INCORRECT}
        >{letter}</div>
    {/each}
</div>

<style>
    :root {
    --correct: #0e6a23db;
    --present: #ea842bc2;
    --incorrect: #6c757d;
    --white: #f1edede1;
    --ltr-height: 1.5em;
    --ltr-width: 1.5em;
    --font-size: 2rem;
    --letter-delay: 200ms; /* Delay per letter */
    
}
@media (max-width: 480px) {
    :root {
        --ltr-width: 1.2em;
        --ltr-height: 1.2em;
    }
}

.wordrow {
    display: flex;
    gap: calc(4px * var(--stretch,1));
    flex-wrap: wrap;
    justify-content: start;
}

.letter {
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
    animation: pop-in 300ms ease-out;
    animation-fill-mode: both;
    font-stretch: var(--font-stretch, 100%);
}

/* Feedback Styles */
.present {
    background: radial-gradient(circle, var(--present) 70%, transparent 100%);
    backdrop-filter: blur(2px);
    animation:  pop-in 300ms, fade-to-present 300ms ease-out;
    animation-fill-mode: both;
}

.incorrect {
    background: var(--incorrect);
    color: #ffffff;
    filter: brightness(0.7);
    animation:  pop-in 300ms, fade-to-incorrect 300ms ease-out;
    animation-fill-mode: both;
}

.correct-left {
    background: linear-gradient(to right, var(--correct) 40%, var(--incorrect) 60%);
    animation:  pop-in 300ms, fade-to-correct-left 300ms ease-out;
    animation-fill-mode: both;
}

.correct-right {
    background: linear-gradient(to left, var(--correct) 40%, var(--incorrect) 60%);
    animation:  pop-in 300ms, fade-to-correct-right 300ms ease-out;
    animation-fill-mode: both;
}

.correct-left-and-right {
    background: var(--correct);
    border: 3px solid var(--correct);
    animation: pop-in 300ms, fade-to-correct-both 300ms ease-out;
    animation-fill-mode: both;
}

/* Keyframes */
@keyframes pop-in {
    0% {
        transform: scale(0.5);
        color: transparent;
        opacity: 0;
    }
    100% {
        transform: scale(1);
        color: rgb(255, 255, 255);
        text-shadow: 2px 2px 3px rgba(18, 54, 1, 0.644);        
        opacity: 1;
    }
}

@keyframes fade-to-present {
    from {
        background: transparent;
    }
    to {
        background: radial-gradient(circle, var(--present) 70%, transparent 100%);
    }
}

@keyframes fade-to-incorrect {
    from {
        background: transparent;
    }
    to {
        background: var(--incorrect);
    }
}

@keyframes fade-to-correct-left {
    from {
        background: transparent;
    }
    to {
        background: linear-gradient(to right, var(--correct) 40%, var(--incorrect) 60%);
    }
}

@keyframes fade-to-correct-right {
    from {
        background: transparent;
    }
    to {
        background: linear-gradient(to left, var(--correct) 40%, var(--incorrect) 60%);
    }
}

@keyframes fade-to-correct-both {
    from {
        background: transparent;
    }
    to {
        background: var(--correct);
    }
}

/* Staggering Animations for Each Letter */
.letter:nth-child(1) {
    animation-delay: calc(1 * var(--letter-delay));
}

.letter:nth-child(2) {
    animation-delay: calc(2 * var(--letter-delay));
}

.letter:nth-child(3) {
    animation-delay: calc(3 * var(--letter-delay));
}

.letter:nth-child(4) {
    animation-delay: calc(4 * var(--letter-delay));
}

.letter:nth-child(5) {
    animation-delay: calc(5 * var(--letter-delay));
}

.letter:nth-child(6) {
    animation-delay: calc(6 * var(--letter-delay));
}

.letter:nth-child(7) {
    animation-delay: calc(7 * var(--letter-delay));
}

.letter:nth-child(8) {
    animation-delay: calc(8 * var(--letter-delay));
}

.letter:nth-child(9) {
    animation-delay: calc(9 * var(--letter-delay));
}

.letter:nth-child(10) {
    animation-delay: calc(10 * var(--letter-delay));
}

.letter:nth-child(11) {
    animation-delay: calc(11 * var(--letter-delay));
}

.letter:nth-child(12) {
    animation-delay: calc(12 * var(--letter-delay));
}

.letter:nth-child(13) {
    animation-delay: calc(13 * var(--letter-delay));
}

.letter:nth-child(14) {
    animation-delay: calc(14 * var(--letter-delay));
}

.letter:nth-child(15) {
    animation-delay: calc(15 * var(--letter-delay));
}

.letter:nth-child(16) {
    animation-delay: calc(16 * var(--letter-delay));
}

.letter:nth-child(17) {
    animation-delay: calc(17 * var(--letter-delay));
}

.letter:nth-child(18) {
    animation-delay: calc(18 * var(--letter-delay));
}

.letter:nth-child(19) {
    animation-delay: calc(19 * var(--letter-delay));
}

.letter:nth-child(20) {
    animation-delay: calc(20 * var(--letter-delay));
}
.letter:nth-child(21) {
    animation-delay: calc(21 * var(--letter-delay));
}

.letter:nth-child(22) {
    animation-delay: calc(22 * var(--letter-delay));
}

.letter:nth-child(23) {
    animation-delay: calc(23 * var(--letter-delay));
}

.letter:nth-child(24) {
    animation-delay: calc(24 * var(--letter-delay));
}

.letter:nth-child(25) {
    animation-delay: calc(25 * var(--letter-delay));
}

.letter:nth-child(26) {
    animation-delay: calc(26 * var(--letter-delay));
}

.letter:nth-child(27) {
    animation-delay: calc(27 * var(--letter-delay));
}

.letter:nth-child(28) {
    animation-delay: calc(28 * var(--letter-delay));
}

.letter:nth-child(29) {
    animation-delay: calc(29 * var(--letter-delay));
}

.letter:nth-child(30) {
    animation-delay: calc(30 * var(--letter-delay));
}

.letter:nth-child(31) {
    animation-delay: calc(31 * var(--letter-delay));
}

.letter:nth-child(32) {
    animation-delay: calc(32 * var(--letter-delay));
}

.letter:nth-child(33) {
    animation-delay: calc(33 * var(--letter-delay));
}

.letter:nth-child(34) {
    animation-delay: calc(34 * var(--letter-delay));
}

.letter:nth-child(35) {
    animation-delay: calc(35 * var(--letter-delay));
}

.letter:nth-child(36) {
    animation-delay: calc(36 * var(--letter-delay));
}

.letter:nth-child(37) {
    animation-delay: calc(37 * var(--letter-delay));
}

.letter:nth-child(38) {
    animation-delay: calc(38 * var(--letter-delay));
}

.letter:nth-child(39) {
    animation-delay: calc(39 * var(--letter-delay));
}

.letter:nth-child(40) {
    animation-delay: calc(40 * var(--letter-delay));
}

.letter:nth-child(41) {
    animation-delay: calc(41 * var(--letter-delay));
}

.letter:nth-child(42) {
    animation-delay: calc(42 * var(--letter-delay));
}

.letter:nth-child(43) {
    animation-delay: calc(43 * var(--letter-delay));
}

.letter:nth-child(44) {
    animation-delay: calc(44 * var(--letter-delay));
}

.letter:nth-child(45) {
    animation-delay: calc(45 * var(--letter-delay));
}
.wordrow.no-feedback .letter {
    animation: none !important;
}

</style>
