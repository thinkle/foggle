import {
	type FEEDBACK,
	type ComputedFeedback,
	INCORRECT,
	PRESENT,
	CORRECT_B,
	CORRECT_L,
	CORRECT_R,
	type KEYBOARD_FEEDBACK,
	CORRECT_SPLIT,
    type LetterInfo
} from './types';

type WordFeedback = {
	word: FEEDBACK[];
	keyboard: { [letter: string]: KEYBOARD_FEEDBACK };
};

export const computeFeedback = (guesses: string[], answer: string): ComputedFeedback => {
    const wordsFeedback = guesses.map((word) => computeWordFeedback(word, answer));    
    const guessFeedback = wordsFeedback.map((wf) => wf.word);
    const letterFeedback = mergeKeyboardFeedback(wordsFeedback);
    let minWordLength = 1;
    for (let i =0; i<guesses.length; i++) {
        let nLetters = 1;
        const feedback = guessFeedback[i];
        const leftmostRight = Math.max(feedback.indexOf(CORRECT_R), feedback.indexOf(CORRECT_B));
        const rightmostLeft = Math.max(feedback.lastIndexOf(CORRECT_L), feedback.lastIndexOf(CORRECT_B));
        if (leftmostRight > -1) {
            nLetters = Math.max(nLetters, feedback.length - leftmostRight);
        }
        if (rightmostLeft > -1) {
            nLetters = Math.max(nLetters, rightmostLeft + 1);
        }
        if (nLetters > minWordLength) {
            minWordLength = nLetters;
        }
    }
    
    const letterKnowledge : LetterInfo[] = Array.from(answer).map(
        (letter, i) : LetterInfo => {    
            let status : LetterInfo;
            for (let guessIndex = 0; guessIndex < guesses.length; guessIndex++) {
                const fb = guessFeedback[guessIndex];
                if ([CORRECT_L,CORRECT_B].includes(fb[i])) {
                    // correct from left -- half known
                    if (status===CORRECT_R) {
                        // early exit
                        return CORRECT_B;
                    } else {
                        status = CORRECT_L;
                    }
                }
                const fromRight = (answer.length - i);
                const guessFromRightIndex = fb.length - fromRight;
                if ([CORRECT_R,CORRECT_B].includes(fb[guessFromRightIndex])) {
                    // correct from right -- half known
                    if (status === CORRECT_L) {
                        // early exit
                        return CORRECT_B;
                    } else {
                        status = CORRECT_R;
                    }
                }
            }
            if (status) return status;             
            // now check presence...            
            const dupCount = Array.from(answer.substring(0,i)).filter((ltr,idx)=>ltr==letter).length;
            for (let guessIndex = 0; guessIndex < guesses.length; guessIndex++) {
                const guess = guesses[guessIndex];
                const fb = guessFeedback[guessIndex];
                if (fb.filter((letterFeedback,feedbackIndex)=>letterFeedback==PRESENT && guess[feedbackIndex]==letter).length > dupCount) {
                    return PRESENT;
                }
            }
            return 'unknown';
    });
    let progressCount = 0;
    for (const known of letterKnowledge) {
        if (known === CORRECT_B) { progressCount += 1; }
        else if (known === CORRECT_L || known === CORRECT_R) { progressCount += 0.5; }
        else if (known === PRESENT) { progressCount += 0.333; }
    }
    const progress = progressCount / answer.length;

    return {
        guessFeedback,
        letterFeedback,
        minWordLength: minWordLength,
        letterKnowledge,
        progress
    }
};

const keyboardFeedbackManager = () => {
	const keyboardFeedback: { [letter: string]: KEYBOARD_FEEDBACK } = {};
	return {
		keyboardFeedback,
		addLetterFeedback: (letter: string, feedback: FEEDBACK) => {
			if (keyboardFeedback[letter] == CORRECT_B) {
				// already know it's right -- ignore
				if (feedback == INCORRECT) {
					console.error('This should be impossible: algorithm is broken!');
					window.alert(
						'This should be impossible! Please report this bug and send a screenshot to tmhinkle@gmail.com :)!'
					);
				}
				return;
			} else if (keyboardFeedback[letter] == INCORRECT) {
				if (feedback !== INCORRECT) {
					console.error('This should be impossible: algorithm is broken!');
					window.alert(
						'This should be impossible! Please report this bug and send a screenshot to tmhinkle@gmail.com!'
					);
				}
			} else if (feedback == CORRECT_B || feedback == INCORRECT) {
				// these two are easy... just set the feedback
				keyboardFeedback[letter] = feedback;
			} else if (feedback == CORRECT_L) {
				// Now it gets a bit trickier -- we need to check if we already have feedback
				// for this letter and if so, we need to update it.
				if (keyboardFeedback[letter] == CORRECT_R || keyboardFeedback[letter] == CORRECT_SPLIT) {
					keyboardFeedback[letter] = CORRECT_SPLIT;
				} else {
					keyboardFeedback[letter] = CORRECT_L;
				}
			}
			else if (feedback == CORRECT_R) {
				if (keyboardFeedback[letter] == CORRECT_L || keyboardFeedback[letter] == CORRECT_SPLIT) {
					keyboardFeedback[letter] = CORRECT_SPLIT;
				} else {
					keyboardFeedback[letter] = CORRECT_R;
				}
			} else if (feedback == PRESENT) {
                if (!keyboardFeedback[letter]) {
                    keyboardFeedback[letter] = PRESENT;
                }
            }
		}
	};
};

const mergeKeyboardFeedback = (wordsFeedback: WordFeedback[]): { [letter: string]: KEYBOARD_FEEDBACK } => {
    const aggregateFeedback : {[letter:string]: KEYBOARD_FEEDBACK} = {};
    // lowest to highest ranking of importance...
    const precedence : KEYBOARD_FEEDBACK[] = [CORRECT_B, CORRECT_SPLIT, CORRECT_L, CORRECT_R, PRESENT, INCORRECT];
    wordsFeedback.forEach((wf) => {
        Object.keys(wf.keyboard).forEach((letter) => {
            const current = aggregateFeedback[letter];
            const incoming = wf.keyboard[letter];
            if (!current) {
                aggregateFeedback[letter] = incoming;
            } else if (
                (current == CORRECT_L && incoming == CORRECT_R) 
                ||
                (current == CORRECT_R && incoming == CORRECT_L)
            ) {
                aggregateFeedback[letter] = CORRECT_SPLIT;
            } else {                
                const currentIdx = precedence.indexOf(current);
                const incomingIdx = precedence.indexOf(incoming);
                if (incomingIdx < currentIdx) {
                    aggregateFeedback[letter] = incoming;
                }
            }
        });
    });
    return aggregateFeedback;
}

export const computeWordFeedback = (guess: string, answer: string): WordFeedback => {
	const feedback: FEEDBACK[] = [];
	const kbFdbManager = keyboardFeedbackManager();
    const presentPerLetter : {[letter: string]: number} = {};
	for (let i = 0; i < guess.length; i++) {
		const letter = guess[i];
		const fromRight = guess.length - i;
		const answerRightIndex = answer.length - fromRight;
		if (!answer.includes(letter)) {
			// Missing letter - mark as incorrect!
			kbFdbManager.addLetterFeedback(letter, INCORRECT);
			feedback.push(INCORRECT);
		} else {
			// Now it gets more complicated....
			const correctFromLeft = answer && answer[i] === letter;
			const correctFromRight = answer && answer[answerRightIndex] === letter;
			if (correctFromLeft && correctFromRight) {
				kbFdbManager.addLetterFeedback(letter, CORRECT_B);
				feedback.push(CORRECT_B);
			} else if (correctFromLeft) {
				kbFdbManager.addLetterFeedback(letter, CORRECT_L);
				feedback.push(CORRECT_L);
			} else if (correctFromRight) {
				kbFdbManager.addLetterFeedback(letter, CORRECT_R);
				feedback.push(CORRECT_R);
			} else {
                // PRESENT is a special case because we could have
                // e.g. 4 'e's in the guess and 3 in the answer
                // and need to color only the first 3 present
				const unmatchedInAnswer = Array.from(answer).filter((ltr, idx) => (
                    ltr === letter &&
                    answer[idx] !== guess[idx] && // Not matched from the left
                    answer[idx] !== guess[guess.length - (answer.length - idx)] // Not matched from the right
                )).length;
                if (unmatchedInAnswer > (presentPerLetter[letter] || 0)) {
                    kbFdbManager.addLetterFeedback(letter, PRESENT);
                    feedback.push(PRESENT);                    
                    presentPerLetter[letter] = (presentPerLetter[letter] || 0) + 1;
                } else {
                    // no need to update keyboard here since we know this
                    // letter is already marked present or correct elsewhere.
                    feedback.push(INCORRECT);
                }
			}
		}
	}
    return {
        word: feedback,
        keyboard: kbFdbManager.keyboardFeedback,
    }
};
