
// Very simple rotating shift cipher (not secure)

export function encode(plaintext: string): string {
    return Array.from(plaintext)
        .map((char, i) => {
            const shift = (i % 17) + 1; // 1..17
            return String.fromCharCode(char.charCodeAt(0) + shift);
        })
        .join('');
}

export function decode(ciphertext: string): string {
    return Array.from(ciphertext)
        .map((char, i) => {
            const shift = (i % 17) + 1; // 1..17
            return String.fromCharCode(char.charCodeAt(0) - shift);
        })
        .join('');
}

const MIN_CLUE_LENGTH = 40;
const paddingLetters = 'QRSTUVWXYZ';
export function encodeClue (clue : string) : string {
    clue = clue.toLowerCase(); // ensure lower case
    while (clue.length < MIN_CLUE_LENGTH) {        
        clue = clue + paddingLetters[Math.floor(Math.random() * paddingLetters.length)];
    }
    return encode(clue);
}

export function decodeClue (clue : string) : string {
    clue = decode(clue);
    for (let i = 0; i < paddingLetters.length; i++) {
        clue = clue.replace(new RegExp("["+paddingLetters[i]+"]", 'g'), '');
    }
    return clue;
}