import type { PuzzleType } from "./gameInProgress";

export const CORRECT_L = 'correct-left-indexed';
export const CORRECT_R = 'correct-right-indexed';
export const CORRECT_SPLIT = 'correct-left-right-separately';
export const CORRECT_B = 'correct-left-and-right';
export const INCORRECT = 'incorrect';
export const PRESENT = 'present';

export type FEEDBACK = typeof CORRECT_L | typeof CORRECT_R | typeof CORRECT_B | typeof INCORRECT | typeof PRESENT | typeof undefined;
export type KEYBOARD_FEEDBACK = FEEDBACK | typeof CORRECT_SPLIT;

export type ComputedFeedback = {
    guessFeedback : FEEDBACK[][],
    minWordLength: number,
    letterFeedback : { [letter: string]: KEYBOARD_FEEDBACK },
    progress : number,
    letterKnowledge : LetterInfo[],
}
export type LetterInfo = FEEDBACK | 'unknown';
export type Game = {
    id: number;
    type: PuzzleType;
    word: string;
};
