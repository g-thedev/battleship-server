interface PlayerBoard {
    misses: string[];
    hits: string[];
    ships: Record<string, any>;
}

export class GameState {
    roomId: string | null;
    players: string[]; 
    playerBoards: Record<string, PlayerBoard>; 
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
        this.playerBoards[players[0]] = { misses: [], hits: [], ships: {} };
        this.playerBoards[players[1]] = { misses: [], hits: [], ships: {} };
    }

    updateBoard(playerId: string, move?: string, ships?: any) {
        // Update the game board based on a player's move
        if (ships) {
            this.playerBoards[playerId].ships = ships;
        }

        if (move) {
            if (!this.playerBoards[playerId].misses.includes(move)) {
                this.playerBoards[playerId].misses.push(move);
            }
        }
    }

    checkIfHit(player: string, move: string) {
        // Check if a move hits a ship
        let enemyBoard = this.playerBoards[player].ships;
        for (let ship in enemyBoard) {
            if (enemyBoard[ship].includes(move)) {
                this.playerBoards[player].hits.push(move);
                return true;
            }
        }
        return false;
    }

    // Change this 
    // Need to separate the check from the update of the array
    // Maybe move to checkIfHit?
    checkIfSunk(player: string, move: string) {
        // Check if a move sinks a ship
        let enemyBoard = this.playerBoards[player].ships;
        for (let ship in enemyBoard) {
            if (enemyBoard[ship].includes(move)) {
                enemyBoard[ship] = enemyBoard[ship].filter((square: string) => square !== move);
                if (enemyBoard[ship].length === 0) {
                    console.log('Sunk ship!');
                    console.log(enemyBoard);
                    console.log(ship);
                    return true;
                }
            }
        }
        return false;
    }

    getSunkShip(player: string) {
        let enemyBoard = this.playerBoards[player].ships;
        console.log(enemyBoard);
        for (let ship in enemyBoard) {
            if (enemyBoard[ship].length === 0) {
                delete enemyBoard[ship];
                console.log(ship);
                return ship;
            }
        }
    }

    setPlayerReady(playerId: string) {
        this.readyPlayers.add(playerId);
    }

    allPlayersReady(): boolean {
        return this.readyPlayers.size === 2;
    }

    getOpponent(playerId: string): string {
        return this.players.filter((player) => player !== playerId)[0];
    }

    removePlayer(playerId: string) {
        this.players = this.players.filter((player) => player !== playerId);
        delete this.playerBoards[playerId];
    }

    chooseRandomPlayer(): string {
        return this.players[Math.floor(Math.random() * this.players.length)];
    }

    switchPlayerTurn() {
        if (this.currentTurn !== null) {
            this.currentTurn = this.getOpponent(this.currentTurn);
        } 
    }

    getCurrentTurn(): string | null {
        return this.currentTurn;
    }

    checkIfAllShipsSunk(playerId: string) {
        let enemyBoard = this.playerBoards[playerId].ships;
        return Object.keys(enemyBoard).length === 0;
    }

    checkIfPlayerReady(playerId: string) {
        return Object.keys(this.playerBoards[playerId].ships).length === 5;
    }

    hasPlayer(playerId: string) {
        return this.players.includes(playerId);
    }
}

