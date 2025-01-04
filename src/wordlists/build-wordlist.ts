import { decodeClue, encodeClue } from '../lib/encoder';
import { readFileSync, writeFileSync } from 'fs';
import { getDayIndex } from './magicNumber';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Create __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define file paths
const answerListPath = join(__dirname, 'answerList.txt');
const outputPath = join(__dirname, 'answerList.encoded.txt');

// Read file contents
let rawAnswerList = [];
let existingListEncoded = [];
try {
  rawAnswerList = readFileSync(answerListPath, 'utf8').split('\n').filter(Boolean);
} catch (err) {
  console.error(`Error reading answer list: ${err.message}`);
}

try {
  existingListEncoded = readFileSync(outputPath, 'utf8').split('\n').filter(Boolean);
} catch (err) {
  console.warn(`Output file not found. Starting with an empty encoded list.`);
}

// Fisher-Yates Shuffle
function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

// Determine today's index
const todaysIndex = getDayIndex();
console.log("Today's index is: ", todaysIndex);

// Keep up to today's index in the output list
let outputList = existingListEncoded.slice(0, todaysIndex + 1);
console.log('Keeping output list of ', outputList.length, 'words.');

// Encode new answers and filter out duplicates
const answersToAdd = rawAnswerList
  .map(encodeClue)
  .filter((word) => !outputList.includes(word));

// Shuffle the new answers
shuffle(answersToAdd);
console.log('Adding shuffled list of ', answersToAdd.length, 'new words.');

// Combine the existing and new answers
outputList = [...outputList, ...answersToAdd];

// Write the updated list to the output file
try {
  writeFileSync(outputPath, outputList.join('\n'));
  console.log(`Updated encoded list written to ${outputPath}`);
} catch (err) {
  console.error(`Error writing to output file: ${err.message}`);
}