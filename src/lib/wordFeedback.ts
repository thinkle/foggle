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

    const minWordLengthInfo = calculateMinWordLength(guesses, guessFeedback);
    const minWordLength = minWordLengthInfo.length || 1;

    
    return {
        guessFeedback,
        letterFeedback,
        minWordLength: minWordLength,
        template: minWordLengthInfo.template,
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

function calculateMinWordLength (guesses: string[], guessFeedback: FEEDBACK[][]) : {
    length: number,
    template: string
    } {        
    const FILL = '?'; // placeholder for unknown letters that must be there
    // use a constraint-based approach this time to collect info...
    type Constraint = {
        index : number,
        letter : string,
        side : 'left' | 'right'
    }
    const forbiddenLengths : number[] = [];
    const leftBasedLetters : (Constraint|undefined)[] = [];
    const rightBasedLetters : (Constraint|undefined)[] = [];
    let minSizeBasedOnRight = 0;
    for (let i=0; i<guesses.length; i++) {
        const guess = guesses[i];
        const feedback = guessFeedback[i];
        const length = guess.length;
        let lengthBanned = false; // have we ruled out this length?
        for (let letterIndex=0; letterIndex<length; letterIndex++) {
            const letter = guess[letterIndex];
            const fb = feedback[letterIndex];
            if (fb === CORRECT_L || fb === CORRECT_B) {
                leftBasedLetters[letterIndex] = {index:letterIndex, letter, side:'left'};
            }
            if (fb === CORRECT_R || fb === CORRECT_B) {
                const fromRightIndex = length - letterIndex;
                rightBasedLetters[fromRightIndex] = {index:fromRightIndex, letter, side:'right'};
                if (fromRightIndex > minSizeBasedOnRight) {
                    minSizeBasedOnRight = fromRightIndex;
                }
            }
            if (!lengthBanned && (fb == CORRECT_R || fb == CORRECT_L)) {
                // then we know the word is not the same length
                // as this guess!
                lengthBanned = true;
                forbiddenLengths.push(length);
            }
        }
    }
    const letterCounts : {[letter:string]:number} = calculateLetterCounts(guesses, guessFeedback);
    const smallestWord : Array<string> = [];
    for (let ci=0; ci<Math.max(leftBasedLetters.length,minSizeBasedOnRight); ci++) {
        const constraint = leftBasedLetters[ci]; 
        if (!constraint) {
            smallestWord[ci] = FILL;
        } else {
            if (constraint.index !== ci) {
                console.error('WTF???');
                throw 'oops';
            }
            smallestWord[constraint.index] = constraint.letter;
        }        
    }
    let smallestWordLength = smallestWord.length;

    // Now make sure there is enough room for our letters
    // based on letterCounts and if not ADD letters to the right    
    const additionalLetterCount = calculateAdditionalLetterCount();
    const openLetters = smallestWord.filter((ltr)=>ltr===FILL||!ltr).length;
    if (openLetters < additionalLetterCount) {
        // we need to add more room to the right
        // to fit all the letters
        const extraRoom = additionalLetterCount - openLetters;
        smallestWordLength = smallestWordLength + extraRoom;
        while (smallestWord.length < smallestWordLength) {
            smallestWord.push(FILL);
        }
    }
    // Now check if we are a forbidden length...
    while (forbiddenLengths.includes(smallestWordLength)) {
        smallestWord.push(FILL);
        smallestWordLength = smallestWord.length;
    }

    const finalSmallWord = finalizeWord(smallestWord).map((l)=>l||'?').join('');    
    return {
        template : finalSmallWord,
        length : finalSmallWord.length
    }
    
    // Then, check if we can fit our right based letters and if not
    // add letters to the right until we can
    function finalizeWord (smallestWord : Array<string>) : Array<string> {
        const possiblyFinalWord = smallestWord.slice();
        for (const constraint of rightBasedLetters) {
            if (!constraint) continue;
            const {index, letter} = constraint; // right letters are 1-indexed already
            const adjustedIndex = possiblyFinalWord.length - index;
            if (possiblyFinalWord[adjustedIndex] === letter) {
                // already have this letter -- no need to do anything
                continue;
            } else if (possiblyFinalWord[adjustedIndex] === FILL || !possiblyFinalWord[adjustedIndex]) {
                // we have room -- add the letter
                possiblyFinalWord[adjustedIndex] = letter;
            } else {
                // conflict!                
                // expand...
                smallestWord[smallestWord.length] = FILL;
                // recurse!
                finalizeWord(smallestWord);
            }
        }
        // If we got all the right based letters in, let's make
        // sure we can still fit the unknowns...
        const openLetters = possiblyFinalWord.filter((ltr)=>ltr===FILL||!ltr).length;
        const additionalLetterCount = calculateAdditionalLetterCount(possiblyFinalWord);
        if (openLetters < additionalLetterCount) {
            // we need to add more room to the right
            // to fit all the letters
            const extraRoom = additionalLetterCount - openLetters;
            smallestWordLength = smallestWordLength + extraRoom;
            smallestWord[smallestWordLength - 1] = FILL;
            while (forbiddenLengths.includes(smallestWordLength)) {
                smallestWord.push(FILL);
                smallestWordLength = smallestWord.length;
            }
            return finalizeWord(smallestWord);
        } else {
            return possiblyFinalWord;
        }
    }   


    function calculateAdditionalLetterCount(word=smallestWord) {
        let additionalLetterCount = 0;
        for (const letter in letterCounts) {
            const minCount = letterCounts[letter];
            const currentCount = word.filter((ltr) => ltr == letter).length;
            if (currentCount < minCount) {
                // we need to add letters to the right
                // until we have enough room
                additionalLetterCount += (minCount - currentCount);
            }
        }
        return additionalLetterCount;
    }
}

function calculateLetterCounts(guesses: string[], guessFeedback: FEEDBACK[][]) {
    const letterCounts: { [letter: string]: number; } = {};
    guesses.forEach((guess, guessIndex) => {
        const thisFeedback = guessFeedback[guessIndex];
        // Update to track the actual guesses -- so we need to just keep 
        // track did we get e.g.
        // [CORRECT_L, CORRECT_R, PRESENT, INCORRECT]
        //
        // THEN we need to count up but a CORRECT_L and CORRECT_R
        // could point to the *same* letter in the answer, so we 
        // don't just count those -- i.e. CORRECT_L = 1, 
        // CORRECT_L + CORRECT_R = 1, not 2
        // PRESENT + anything = +1 because PRESENT already checks for dup
        // so PRESENT,PRESENT,CORRECT_L = 3
        //
        // and CORRECT_B = 1 so CORRECT_B, CORRECT_L = 2
        const guessLetterInfo: { [letter: string]: FEEDBACK[]; } = {};
        thisFeedback.forEach((feedback, letterIndex) => {
            const letter = guess[letterIndex];
            if (!guessLetterInfo[letter]) {
                guessLetterInfo[letter] = [feedback];
            } else {
                guessLetterInfo[letter].push(feedback);
            }
        });
        const guessLetterCounts: { [letter: string]: number; } = {};
        for (const letter in guessLetterInfo) {
            const letterFeedback = guessLetterInfo[letter];
            const lCount = letterFeedback.filter((fb) => fb === CORRECT_L || fb == CORRECT_B).length;
            const rCount = letterFeedback.filter((fb) => fb === CORRECT_R || fb == CORRECT_B).length;
            const pCount = letterFeedback.filter((fb) => fb === PRESENT).length;
            const lr = Math.max(lCount, rCount);
            guessLetterCounts[letter] = lr + pCount;
        }
        Object.keys(guessLetterCounts).forEach((letter) => {
            if (!letterCounts[letter]) {
                letterCounts[letter] = guessLetterCounts[letter];
            } else {
                letterCounts[letter] = Math.max(letterCounts[letter], guessLetterCounts[letter]);
            }
        });
    });
    return letterCounts;
}

