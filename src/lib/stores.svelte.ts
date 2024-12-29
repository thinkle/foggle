import { PRESENT, CORRECT_B, CORRECT_L, CORRECT_R, type FEEDBACK } from "./types";

export const letterFeedback : { [letter: string]: FEEDBACK } = $state({})

export const registerFeedback = (letter : string, feedback : FEEDBACK) => {
    letter = letter.toUpperCase();
    // handle cases where we know the letter's position
    // from both sides...
    if (feedback == CORRECT_B) {
        //both always wins...
        letterFeedback[letter] = CORRECT_B;
        return;
    }
    if (letterFeedback[letter] == CORRECT_B) {
        // no need to update feedback for this letter
        return;
    } else if (letterFeedback[letter] == CORRECT_L && feedback == CORRECT_R) {
        letterFeedback[letter] = CORRECT_B;
    } else if (letterFeedback[letter] == CORRECT_R && feedback == CORRECT_L) {
        letterFeedback[letter] = CORRECT_B;
    }        
    if ([CORRECT_B,CORRECT_L,CORRECT_R].includes(feedback)) {
        letterFeedback[letter] = feedback;
    } else if ([CORRECT_L, CORRECT_R].includes(letterFeedback[letter])) {
        // no need to update feedback for this letter if we already
        // knew more...
        return;
    }
    // otherwise, just assign the feedback
    letterFeedback[letter] = feedback;
}

export const resetFeedback = () => {
    for (const letter in letterFeedback) {
        letterFeedback[letter] = undefined;
    }
}