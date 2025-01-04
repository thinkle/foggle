import allTheWords from '../wordlists/allTheWords.txt?raw';
import answerList from '../wordlists/answerList.encoded.txt?raw';
import { decodeClue } from './encoder';
import { getDayIndex } from '../wordlists/magicNumber';

const words = allTheWords.split(/\s*\n\s*/g)
const answers = answerList.split(/\s*\n\s*/g)

export const getRandomWord = () => {
    //return 'continue'
    return decodeClue(answers[Math.floor(Math.random() * answers.length)]);
}

export const getDailyWord = (date = new Date()) => {
    // don't allow future dates
    if (date > new Date()) {
        date = new Date();
    }
    const index = getDayIndex(date);    
    return decodeClue(answers[index % answers.length]);
}

export const isValid = (word : string) => {
    return words.indexOf(word) > -1; 
}
console.log('Got me words!',words)