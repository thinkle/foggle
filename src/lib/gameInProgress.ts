import { encode, decode, encodeClue, decodeClue } from "./encoder";
import { getDailyWord } from "./words";

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

const SAVED_GAME_KEY = 'savedGame';
const SAVED_DAILY_KEY = 'savedDaily';

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
        // Check if it's daily or not...
        if (game.puzzleType === 'daily') {
            localStorage.setItem(SAVED_DAILY_KEY, JSON.stringify(storedGame));
        } else {
            localStorage.setItem(SAVED_GAME_KEY, JSON.stringify(storedGame));
        }
    }
}

export function clearSavedGame(puzzleType : PuzzleType = 'extra'): void {
    if (puzzleType === 'daily') {
        localStorage.removeItem(SAVED_DAILY_KEY);
    } else {
        localStorage.removeItem(SAVED_GAME_KEY);
    }
}

export function completeSavedGame (game : SavedGame) : void {
    const gameHistory = getGameHistory();
    gameHistory.push(game);
    localStorage.setItem('gameHistory', JSON.stringify(gameHistory));
    clearSavedGame(game.puzzleType);
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

export function getSavedGame (): SavedGame | null {
    const dailySaved = getSavedGameData('daily');
    if (dailySaved) {
        if (decode(dailySaved.currentWord) === getDailyWord()) {
            return dailySaved;
        } else {
            // add to history if it's not the right word.
            completeSavedGame(dailySaved);
        }
    }
    // If we're still running, we didn't return a daily saved game...
    return getSavedGameData('extra');    
}

export function getSavedGameData(puzzleType: PuzzleType = 'extra'): SavedGame | null {
    let key = SAVED_GAME_KEY;
    if (puzzleType === 'daily') {
        key = SAVED_DAILY_KEY;
    }    
    const raw = localStorage.getItem(key);
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
            complete : !!game.solved || game.guesses.length === 6,
            solved: !!game.solved
        } as GameResult)
    );
}