import allTheWords from './allTheWords.txt?raw';
import answerList from './answerList.txt?raw';

const words = allTheWords.split(/\s*\n\s*/g)
const answers = answerList.split(/\s*\n\s*/g)

export const getTheWord = () => {
    return 'continue'
    return answers[Math.floor(Math.random() * answers.length)];
}

export const isValid = (word : string) => {
    return words.indexOf(word) > -1; 
}
console.log('Got me words!',words)