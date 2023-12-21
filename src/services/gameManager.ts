import { GameState } from './gameState';

const gameStates = new Map<string, GameState>();

export const createGame = (roomId: string, players: string[]): void => {
    const gameState = new GameState();
    gameState.initialize(roomId, players);
    gameStates.set(roomId, gameState);
};

export const getGameState = (roomId: string): GameState | undefined => {
    return gameStates.get(roomId);
};

