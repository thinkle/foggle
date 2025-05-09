import allTheWords from '../wordlists/allTheWords.txt?raw';
import answerList from '../wordlists/answerList.encoded.txt?raw';
import { decodeClue } from './encoder';
import { getDayIndex } from '../wordlists/magicNumber';
import type { Game } from './types';

const words = allTheWords.split(/\n/g);
const answers = answerList.split(/\n/g);

export const getRandomGame = (): Game => {
	//return 'continue'
	const id = Math.floor(Math.random() * answers.length);
	const word = decodeClue(answers[id]);
	return { id, word, type: 'extra' };
};

export const getAnswerWords = () => {
	// wowza
	return answers.map(decodeClue);
};

export const getDailyWord = (date = new Date()) => {
	// don't allow future dates
	if (date > new Date()) {
		date = new Date();
	}
	const index = getDayIndex(date);
	return decodeClue(answers.at(index % answers.length));
};

export const isValid = (word: string) => {
	return word && words.indexOf(word) > -1;
};

export const validWords = words;
