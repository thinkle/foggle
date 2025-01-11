/* Manage resuming game, getting new game, and daily vs. unlimited mode */

import { getDayIndex } from "../wordlists/magicNumber";
import { completeSavedGame, getGameHistory, getSavedGame, getSavedGameData, getSavedMode, hasCompletedDaily, hasCompletedExtra, setSavedMode, type SavedGame } from "./gameInProgress"
import type { Game } from "./types";
import { getDailyWord, getRandomGame } from "./words";

let completedDaily = $state(false);
let dailyCheckerInterval : null | number  = $state(null);
const callbacks : (()=>void)[] = [];


type GameAndGuesses = Game & {    
    guesses: string[];
}

function loadInitialGame () : GameAndGuesses {
    const mode = getSavedMode();
    if (mode === 'daily') {
        return getDailyGame();
    } else {
        const dailyIndex = getDayIndex();
        if (!hasCompletedDaily(dailyIndex)) {
            markDailyAvailable();
        }
        return getNewExtraGame();
    }
}

function loadInitialGameOld () : GameAndGuesses {    
    let savedGame = getSavedGame();
    if (savedGame?.guesses.length === 6 || savedGame?.solved) {        
        completeSavedGame(savedGame);
        savedGame = null;
    }
    if (savedGame) {     
        if (savedGame.puzzleType !== 'daily') {        
            const daily = getDayIndex();
            console.log('Daily #', daily);            
            if (!hasCompletedDaily(daily)) {
                markDailyAvailable();
            }
        }
        return {
            id : savedGame.puzzleId,
            type : savedGame.puzzleType,
            word : savedGame.currentWord,
            guesses : savedGame.guesses,
        };
    } else {        
        return getDailyGame();
    }    
}

function getDailyGame () : GameAndGuesses {
    const todaysPuzzle = getDayIndex();    
    if (!hasCompletedDaily(todaysPuzzle)) {
        completedDaily = false; // not completed daily
        if (dailyCheckerInterval) {
            clearInterval(dailyCheckerInterval);
        }
        return {
            id: todaysPuzzle,
            type: 'daily',
            word: getDailyWord(),
            guesses: []
        }
    } else {
        // get saved daily...
        const history = getGameHistory();
        const completedDaily = history.find((game) => game.puzzleType === 'daily' && game.puzzleId === todaysPuzzle);
        if (!completedDaily) {
            // This should never happen but just in case...
            console.error('Completed daily not found in history');
            return {
                id : todaysPuzzle,
                type : 'daily',
                word : getDailyWord(),
                guesses : []
            }
        } else {
            // we just return the saved puzzle
            return {
                id : todaysPuzzle,
                type : 'daily',
                word : completedDaily.currentWord,
                guesses : completedDaily.guesses
            }
        }
    }
}

function getNewExtraGame (level = 1) : GameAndGuesses {
    // Check for saved game...
    debugger;
    const savedExtra = getSavedGameData('extra');
    if (savedExtra && savedExtra.guesses.length < 6 && !savedExtra.solved) {
        console.log('Returning saved extra!',savedExtra);
        return {
            id : savedExtra.puzzleId,
            type : 'extra',
            word : savedExtra.currentWord,
            guesses : savedExtra.guesses
        }
    }
    const RECURSION_LIMIT = 50;            
    completedDaily = true;
    if (!dailyCheckerInterval) {        
        dailyCheckerInterval = window.setInterval(() => {
            if (!hasCompletedDaily(getDayIndex())) {
                markDailyAvailable();
                clearInterval(dailyCheckerInterval as number) ;
                dailyCheckerInterval = null;
            }
        },10000);
    }
    const game = getRandomGame();
    console.log('Got game',game);
    if (hasCompletedExtra(game.word)) {       
        if (level < RECURSION_LIMIT) {
            return getNewExtraGame(level + 1);
        } else {                
            return {...game, guesses:[]};
        }
    } else {        
        return {...game,guesses:[]};
    }

}


export const gameManager = {    
    loadInitialGame,
    getNewExtraGame,
    getDailyGame,
    completedDaily,    
    setNewDailyCallback : (callback : () => void) => {
        callbacks.push(callback);       
    },
    setMode : setSavedMode,
}

function markDailyAvailable() {
    for (const cb of callbacks) {
        cb();
    }
}
