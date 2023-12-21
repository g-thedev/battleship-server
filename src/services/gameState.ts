interface PlayerBoard {
    misses: any[]; // Replace 'any' with a more specific type if possible
    ships: Record<string, any>; // Again, use a more specific type if you can
}

export class GameState {
    roomId: string | null; // Room ID
    players: string[]; // List of players in the game
    playerBoards: Record<string, PlayerBoard>; // Game board or similar structure
    currentTurn: string | null;
    readyPlayers: Set<string>; 

    constructor() {
        this.roomId = '';
        this.players = [];
        this.playerBoards = {};
        this.currentTurn = null;
        this.readyPlayers = new Set();
        // ... other game-specific state properties
    }

    // Initialize the game state
    initialize(roomId: string, players: string[]) {
        this.roomId = roomId;
        this.players = players;
        this.playerBoards = {};
        this.playerBoards[players[0]] = { misses: [], ships: {} };
        this.playerBoards[players[1]] = { misses: [], ships: {} };
    }

    updateBoard(player: string, move?: string, ships?: any) {
        // Update the game board based on a player's move
        if (ships) {
            this.playerBoards[player].ships = ships;
        }

        if (move) {
            if (!this.playerBoards[player].misses.includes(move)) {
                this.playerBoards[player].misses.push(move);
            }
        }
    }

    checkIfHit(player: string, move: string) {
        // Check if a move hits a ship
        let enemyBoard = this.playerBoards[player].ships;
        for (let ship in enemyBoard) {
            if (enemyBoard[ship].includes(move)) {
                return true;
            }
        }
        return false;
    }


    playerReady(playerId: string) {
        this.readyPlayers.add(playerId);
    }

    allPlayersReady(): boolean {
        return this.readyPlayers.size === 2;
    }
}

