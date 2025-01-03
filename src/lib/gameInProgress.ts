import { encode, decode, encodeClue, decodeClue } from "./encoder";

export type PuzzleType = 'daily' | 'extra';

export interface SavedGame {
    currentWord: string;
    guesses: string[];
    puzzleType: PuzzleType;
    puzzleId: number;
    solved?: boolean;
}

export interface GameResult {
    puzzleId: number;
    puzzleType: PuzzleType;    
    nguesses : number;
    solved : boolean;
}

const STORAGE_KEY = 'savedGame';

export function setSavedGame(game: SavedGame): void {
    const solved = game.guesses
        .map((g)=>g.toLowerCase())
        .includes(game.currentWord.toLowerCase());
    if (solved) {
        console.log('Saved game complete!');
        game.solved = true;
        completeSavedGame(game);
    } else {
        console.log('Saving game in progress...');
        const encodedWord = encodeClue(game.currentWord);
        const storedGame = {
            ...game,
            currentWord: encodedWord,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storedGame));
    }
}

export function clearSavedGame(): void {
    localStorage.removeItem(STORAGE_KEY);
}

export function completeSavedGame (game : SavedGame) : void {
    let gameHistory = getGameHistory();
    gameHistory.push(game);
    localStorage.setItem('gameHistory', JSON.stringify(gameHistory));
    clearSavedGame();
}

export function getGameHistory() : SavedGame[] {
    const existingGameHistoryText = localStorage.getItem('gameHistory');
    let gameHistory = [];
    if (existingGameHistoryText) {
        try {
            gameHistory = JSON.parse(existingGameHistoryText);
        } catch (err) {
            console.error('Failed to parse game history:', err);
            gameHistory = [];
        }
    }
    return gameHistory;
}

export function getSavedGame(): SavedGame | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
        const storedGame = JSON.parse(raw);
        const decryptedWord = decodeClue(storedGame.currentWord);
        return {
            ...storedGame,
            currentWord: decryptedWord,
        };
    } catch (e) {
        console.error('Failed to parse saved game:', e);
        return null;
    }
}

export function getGameResults(): GameResult[] {
    const gameHistory = getGameHistory();
    return gameHistory.map(
        (game) => ({
            puzzleId: game.puzzleId,
            puzzleType: game.puzzleType,
            nguesses: game.guesses.length,
            solved: !!game.solved
        } as GameResult)
    );
}
for (const word of ['hello','illumination','ant','amazingness','buzzzz']) {
    const encoded = encodeClue(word);
    console.log('Encoding:->', {
        word,
        encoded : encoded,
        rawEncoded: encode(word),
        decoded: decodeClue(encoded),
        decodedRaw: decode(encoded)
    });
}
