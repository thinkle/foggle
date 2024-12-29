export const CORRECT_L = 'correct-left-indexed';
export const CORRECT_R = 'correct-right-indexed';
export const CORRECT_B = 'correct-left-and-right';
export const INCORRECT = 'incorrect';
export const PRESENT = 'present';

export type FEEDBACK = typeof CORRECT_L | typeof CORRECT_R | typeof CORRECT_B | typeof INCORRECT | typeof PRESENT | typeof undefined;
