import allTheWords from '../wordlists/allTheWords.txt?raw';
import answerList from '../wordlists/answerList.encoded.txt?raw';
import { decodeClue, getWordIdentifier } from './encoder';
import { getDayIndex } from '../wordlists/magicNumber';
import type { Game } from './types';

const words = allTheWords.split(/\n/g);
const answers = answerList.split(/\n/g);
let extraIdentifierIndex: Map<string, number> | null = null;

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

function buildExtraIdentifierIndex(): Map<string, number> {
	const index = new Map<string, number>();
	for (let i = 0; i < answers.length; i++) {
		const word = decodeClue(answers[i]);
		const identifier = getWordIdentifier(word);
		if (!index.has(identifier)) {
			index.set(identifier, i);
		}
	}
	return index;
}

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

export const getPuzzleIdFromWord = (word: string): number => {
	for (let i = 0; i < answers.length; i++) {
		if (decodeClue(answers[i]) === word) {
			return i;
		}
	}
	return -1; // Word not found in answers
};

export const getExtraGameByIdentifier = (identifier: string): Game | null => {
	if (!extraIdentifierIndex) {
		extraIdentifierIndex = buildExtraIdentifierIndex();
	}
	const index = extraIdentifierIndex.get(identifier);
	if (index === undefined) {
		return null;
	}
	const word = decodeClue(answers[index]);
	return { id: index, word, type: 'extra' };
};

export const validWords = words;
