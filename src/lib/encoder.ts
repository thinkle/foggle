// Very simple rotating shift cipher (not secure)

export function encodeOg(plaintext: string): string {
	return Array.from(plaintext)
		.map((char, i) => {
			const shift = (i % 17) + 1; // 1..17
			return String.fromCharCode(char.charCodeAt(0) + shift);
		})
		.join('');
}

export function decodeOg(ciphertext: string): string {
	return Array.from(ciphertext)
		.map((char, i) => {
			const shift = (i % 17) + 1; // 1..17
			return String.fromCharCode(char.charCodeAt(0) - shift);
		})
		.join('');
}
const PRINTABLE_MIN = 32; // Minimum printable ASCII character (' ')
const PRINTABLE_MAX = 126; // Maximum printable ASCII character ('~')
const PRINTABLE_RANGE = PRINTABLE_MAX - PRINTABLE_MIN + 1;

/**
 * Calculate a deterministic base shift from the input.
 * Ensures the same input always produces the same output.
 */
function calculateBaseShift(input: string): number {
	const asciiSum = Array.from(input).reduce((sum, char) => sum + char.charCodeAt(0), 0);
	return (asciiSum % PRINTABLE_RANGE) + 1; // Base shift: 1 to PRINTABLE_RANGE
}

/**
 * Encode a string using deterministic base shift.
 * Shifts wrap within the printable ASCII range (32-126).
 */
export function encode(plaintext: string): string {
	const baseShift = calculateBaseShift(plaintext);

	const encoded = Array.from(plaintext)
		.map((char, i) => {
			const shift = baseShift + (17 - (i % 17)); // Base shift + decreasing shift
			let shiftedCharCode = char.charCodeAt(0) + shift;

			// Wrap around within the printable range
			if (shiftedCharCode > PRINTABLE_MAX) {
				shiftedCharCode = PRINTABLE_MIN + (shiftedCharCode - PRINTABLE_MAX - 1);
			}

			return String.fromCharCode(shiftedCharCode);
		})
		.join('');

	// Append the base shift as a character to the end of the string
	const baseShiftChar = String.fromCharCode(PRINTABLE_MIN + baseShift - 1); // Store baseShift as a printable character
	return encoded + baseShiftChar;
}

/**
 * Decode a string using deterministic base shift.
 * Reverses shifts while wrapping within the printable ASCII range (32-126).
 */
export function decode(ciphertext: string): string {
	const baseShiftChar = ciphertext[ciphertext.length - 1];
	const baseShift = baseShiftChar.charCodeAt(0) - PRINTABLE_MIN + 1; // Reverse base shift mapping

	const encodedContent = ciphertext.slice(0, -1); // Remove the last character
	const decoded = Array.from(encodedContent)
		.map((char, i) => {
			const shift = baseShift + (17 - (i % 17)); // Base shift + decreasing shift
			let shiftedCharCode = char.charCodeAt(0) - shift;

			// Wrap around within the printable range
			if (shiftedCharCode < PRINTABLE_MIN) {
				shiftedCharCode = PRINTABLE_MAX - (PRINTABLE_MIN - shiftedCharCode - 1);
			}

			return String.fromCharCode(shiftedCharCode);
		})
		.join('');

	return decoded;
}
const MIN_CLUE_LENGTH = 45;
const paddingLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export function encodeClue(clue: string): string {
	clue = clue.toLowerCase(); // ensure lower case
	while (clue.length < MIN_CLUE_LENGTH) {
		clue = clue + paddingLetters[Math.floor(Math.random() * paddingLetters.length)];
	}
	return encode(clue);
}

export function decodeClue(clue: string): string {
	clue = decode(clue);
	for (let i = 0; i < paddingLetters.length; i++) {
		clue = clue.replace(new RegExp('[' + paddingLetters[i] + ']', 'g'), '');
	}
	return clue;
}

import SparkMD5 from 'spark-md5';

/**
 * Generate a unique, deterministic identifier for a word.
 * @param word The input word.
 * @param length The length of the identifier (default: 5).
 * @returns A compact, unique Base16 identifier for the word.
 */
export function getWordIdentifier(word: string): string {
	// Create a character set of 256 distinct characters
	const charSet = [
		// ASCII printable characters (32-126)
		...Array.from({ length: 95 }, (_, i) => String.fromCharCode(i + 32)),
		// Extended Latin characters and symbols to reach 256
		...Array.from({ length: 161 }, (_, i) => String.fromCharCode(i + 161))
		// This gives us 95 + 161 = 256 characters
	];

	// Hash the word using SparkMD5
	const hash = SparkMD5.hash(word);

	// Use first 8 bytes of hash (16 hex chars)
	// Each display char represents 2 bytes (4 hex chars)
	const result = [];
	for (let i = 0; i < 8; i += 2) {
		// Convert 4 hex chars (2 bytes) into a single display character
		const byte1 = parseInt(hash.substring(i * 2, i * 2 + 2), 16);
		const byte2 = parseInt(hash.substring(i * 2 + 2, i * 2 + 4), 16);

		// Combine bytes to pick character from our set
		// This gives us a unique mapping in the range 0-255
		const charIndex = (byte1 + byte2) % 256;
		result.push(charSet[charIndex]);
	}

	return result.join('');
}
