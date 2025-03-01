import { decodeClue, encodeClue } from '../lib/encoder';
import { readFileSync, writeFileSync } from 'fs';
import { getDayIndex } from './magicNumber';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { decode } from 'punycode';

// Fisher-Yates Shuffle
function shuffle(array) {
	let currentIndex = array.length,
		randomIndex;
	while (currentIndex !== 0) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;
		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}
	return array;
}

// Create __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define file paths
const answerListPath = join(__dirname, 'answerList.txt');
const outputPath = join(__dirname, 'answerList.encoded.txt');

// Read file contents
let rawAnswerList: string[] = [];
let existingListEncoded: string[] = [];
try {
	rawAnswerList = readFileSync(answerListPath, 'utf8').split('\n').filter(Boolean);
} catch (err) {
	console.error(`Error reading answer list: ${err.message}`);
}

console.log('Beginning with ', rawAnswerList.length, 'words on our fresh answer list');
try {
	existingListEncoded = readFileSync(outputPath, 'utf8').split('\n').filter(Boolean);
} catch (err) {
	console.warn(`Output file not found. Starting with an empty encoded list.`);
}

const existingListDecoded = existingListEncoded.map(decodeClue);

// Determine today's index
const todaysIndex = getDayIndex();
console.log("Today's index is: ", todaysIndex);

// Keep up to today's index in the output list
let outputList = existingListDecoded.slice(0, todaysIndex + 1);
const frozenHistory = new Set(outputList);
console.log('Keeping output list of ', outputList.length, 'words.');
const answersToAdd = rawAnswerList.filter((word) => !frozenHistory.has(word));

// Shuffle the new answers
shuffle(answersToAdd);
console.log('Adding shuffled list of ', answersToAdd.length, 'new words.');

// Combine the existing and new answers
outputList = [...outputList, ...answersToAdd];

const outputSet = new Set(outputList);
if (outputSet.size !== outputList.length) {
	console.log('wtf we have dups!', outputSet.size, '!=', outputList.length);
}
console.log('Output size is ', outputList.length);
if (outputList.length !== rawAnswerList.length) {
	console.warn('Output list length does not match raw list length');
}

const outputListEncoded = outputList.map(encodeClue);

// Write the updated list to the output file
try {
	writeFileSync(outputPath, outputListEncoded.join('\n'));
	console.log(`Updated encoded list written to ${outputPath}`);
} catch (err) {
	console.error(`Error writing to output file: ${err.message}`);
}
