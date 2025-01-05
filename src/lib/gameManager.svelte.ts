/* Manage resuming game, getting new game, and daily vs. unlimited mode */

import { getDayIndex } from "../wordlists/magicNumber";
import { completeSavedGame, getSavedGame, hasCompletedDaily, hasCompletedExtra, type SavedGame } from "./gameInProgress"
import type { Game } from "./types";
import { getDailyWord, getRandomGame } from "./words";

let completedDaily = $state(false);

function loadGame () : SavedGame | void {
    const savedGame = getSavedGame();
    if (savedGame && savedGame.guesses.length < 6) {
        console.log('Load game: Resuming saved game...',savedGame.puzzleId,savedGame.puzzleType);
        return savedGame;
    }
}

type GameAndGuesses = Game & {    
    guesses: string[];
}

function loadInitialGame () : GameAndGuesses {
    let savedGame = getSavedGame();
    if (savedGame?.guesses.length === 6 || savedGame?.solved) {
        console.log('Load game: Saved game is complete. Getting new game...');
        completeSavedGame(savedGame);
        savedGame = null;
    }
    if (savedGame) {
        console.log('Load game: Resuming saved game...',savedGame.puzzleId,savedGame.puzzleType);
        return {
            id : savedGame.puzzleId,
            type : savedGame.puzzleType,
            word : savedGame.currentWord,
            guesses : savedGame.guesses,
        };
    } else {
        console.log('No saved game: getting new game!');
        const game = getNewGame();
        return {
            ...game,
            guesses: [],            
        }
    }    
}

function getNewGame (level = 1) : Game {
    const RECURSION_LIMIT = 50;
    const todaysPuzzle = getDayIndex();    
    if (!hasCompletedDaily(todaysPuzzle)) {
        completedDaily = false;
        return {
            id: todaysPuzzle,
            type: 'daily',
            word: getDailyWord()
        }
    } else {
        completedDaily = true;
        const game = getRandomGame();
        if (hasCompletedExtra(game.word)) {
            console.log('Extra already completed, getting new game...');
            if (level < RECURSION_LIMIT) {
                return getNewGame();
            } else {
                console.log('Forget it -- returning anyway');
                return game;
            }
        } else {
            return game;
        }

    }
}

export const gameManager = {
    loadGame,
    loadInitialGame,
    getNewGame,
    completedDaily,
}