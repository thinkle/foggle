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
const COMPLETED_DAILY_KEY = 'playedDailies';
const COMPLETED_EXTRA_KEY = 'playedGames';
const SAVED_MODE_KEY = 'puzzleMode';

const savedDailies = new Set();

export function getSavedMode () : PuzzleType {
    const mode = localStorage.getItem(SAVED_MODE_KEY) || 'daily';
    if (mode === 'daily') {
        return 'daily';
    } else {
        return 'extra';
    }
}

export function setSavedMode (mode : PuzzleType) : void {
    localStorage.setItem(SAVED_MODE_KEY, mode);
}

function getAttemptedDailies () : number[] {
    const existingDailiesString = localStorage.getItem(COMPLETED_DAILY_KEY);
    let dailies = [];
    if (existingDailiesString) {        
        try {
            dailies = JSON.parse(existingDailiesString);
        } catch (e) {
            console.error('Failed to parse dailies:', e);
        }
    }
    return dailies;
}

function getAttemptedExtras () : string[] {
    const existingExtrasString = localStorage.getItem(COMPLETED_EXTRA_KEY);
    let extras = [];
    if (existingExtrasString) {
        try {
            extras = JSON.parse(existingExtrasString);
        } catch (e) {
            console.error('Failed to parse extras:', e);
        }
    }
    return extras;
}

function saveDailyAttempt (puzzleId : number) : void {
     // If it's a daily puzzle, we save it...
     if (!savedDailies.has(puzzleId)) {        
        const dailies = getAttemptedDailies();
        if (!dailies.includes(puzzleId)) {
            dailies.push(puzzleId);
        }
        localStorage.setItem(COMPLETED_DAILY_KEY, JSON.stringify(dailies));
        savedDailies.add(puzzleId);
    }
}

function saveExtraAttempt (word : string) : void {
    const encodedWord = encodeClue(word);
    const extras = getAttemptedExtras();
    if (!extras.includes(encodedWord)) {
        extras.push(encodedWord);
    }
    localStorage.setItem(COMPLETED_EXTRA_KEY, JSON.stringify(extras));
}

export function hasCompletedExtra (word : string) : boolean {
    return getAttemptedExtras().includes(encodeClue(word));
}

export function hasCompletedDaily (puzzleId : number) : boolean {
    return getAttemptedDailies().includes(puzzleId);
}

export function setSavedGame(game: SavedGame): void {
    if (game.guesses.length === 0) {
        // early exit on no guesses -- no need to save
        return
    }
    if (game.puzzleType == 'daily') {
        saveDailyAttempt(game.puzzleId);
    } else {
        saveExtraAttempt(game.currentWord);
    }
    const solved = game.guesses
        .map((g)=>g.toLowerCase())
        .includes(game.currentWord.toLowerCase());
    if (solved) {        
        game.solved = true;
        completeSavedGame(game);
    } else {        
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

function sanitizeHistory (gameHistory : SavedGame[]) : SavedGame[] {
    gameHistory.reverse();
    let visitedGames = new Set();
    gameHistory = gameHistory.filter((game) => {
        if (visitedGames.has(game.puzzleId+game.puzzleType)) {
            return false;
        } else {
            visitedGames.add(game.puzzleId+game.puzzleType);
            return true;
        }
    });
    gameHistory.reverse();
    return gameHistory;
}

export function completeSavedGame (game : SavedGame) : void {    
    let gameHistory = getGameHistory();
    gameHistory.push(game);
    gameHistory = sanitizeHistory(gameHistory);
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
        if (dailySaved.currentWord === getDailyWord()) {
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