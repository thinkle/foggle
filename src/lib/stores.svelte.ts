import { writable } from "svelte/store";
import { PRESENT, CORRECT_B, CORRECT_L, CORRECT_R, type FEEDBACK } from "./types";

// Global store for letter feedback
export const letterFeedback = writable<{ [letter: string]: FEEDBACK }>({});

// Global store for the minimum word length
export const minWordLength = writable(1);

// Function to register feedback for a letter
export const registerFeedback = (letter: string, feedback: FEEDBACK) => {
    letter = letter.toUpperCase();

    letterFeedback.update((currentFeedback) => {
        // Handle cases where we know the letter's position from both sides
        if (feedback === CORRECT_B) {
            currentFeedback[letter] = CORRECT_B;
            return currentFeedback;
        }

        if (currentFeedback[letter] === CORRECT_B) {
            // No need to update feedback for this letter
            return currentFeedback;
        } else if (currentFeedback[letter] === CORRECT_L && feedback === CORRECT_R) {
            currentFeedback[letter] = CORRECT_B;
        } else if (currentFeedback[letter] === CORRECT_R && feedback === CORRECT_L) {
            currentFeedback[letter] = CORRECT_B;
        } else if ([CORRECT_B, CORRECT_L, CORRECT_R].includes(feedback)) {
            currentFeedback[letter] = feedback;
        } else if ([CORRECT_L, CORRECT_R].includes(currentFeedback[letter])) {
            // No need to update feedback for this letter if we already knew more
            return currentFeedback;
        } else {
            // Otherwise, just assign the feedback
            currentFeedback[letter] = feedback;
        }
        return currentFeedback;
    });
};

// Function to reset all feedback and word length
export const resetFeedback = () => {
    letterFeedback.set({});
    minWordLength.set(1);
};