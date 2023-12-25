import { Server as SocketIOServer } from 'socket.io';
import { attachAuthenticationMiddleware } from '../middleware/socketMiddleware';
import { findUserById } from './usersService';
import { getGameState, createGame, deleteGameState, gameStates } from './gameManager';

export const setupWebSocket = (httpServer: any) => {
  const CLIENT_URL = process.env.CLIENT_ORIGIN;
  
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: CLIENT_URL,
      methods: ["GET", "POST"],
      allowedHeaders: ["my-custom-header"],
      credentials: true
    }
  });

  // Attach the authentication middleware
  attachAuthenticationMiddleware(io);

  const lobbyUsers: { [key: string]: any } = {};
  const userToSocketIdMap: { [userId: string]: string } = {}; // Map of user ID to socket ID

  io.on('connection', async (socket): Promise<void> => {
    if (socket.user?.id) {
      // Add the user's socket ID to the mapping
      userToSocketIdMap[socket.user.id] = socket.id;
    }

    socket.on('join_pvp_lobby', async (data) => {
      const { userId } = data;

      try {
        const user = await findUserById(userId);
        if (user) {
          lobbyUsers[userId] = { id: user.id, username: user.username, socketId: socket.id, inPendingChallenge: false};
        }
      } catch (error) {
        console.error('Error fetching user from database:', error);
      }
      io.emit('update_lobby', lobbyUsers);
    });

    socket.on('leave_pvp_lobby', async (data) => {
      const { userId } = data;
      delete lobbyUsers[userId];
      io.emit('update_lobby', lobbyUsers);
    });

    socket.on('request_lobby_update', () => {
      io.emit('update_lobby', lobbyUsers);
    });

    socket.on('request_challenge', async (data) => {
      const { challengedUserId, challengerUserId } = data;
      
      if (lobbyUsers.hasOwnProperty(challengedUserId)) {
        const challengedUser = lobbyUsers[challengedUserId];
        const challengerUserSocketId = userToSocketIdMap[challengerUserId];
    
        // Check if the challenged user is already in a pending challenge
        if (challengedUser.inPendingChallenge) {
          if (challengerUserSocketId) {
            io.to(challengerUserSocketId).emit('challenge_unavailable', {
              message: 'User is currently unavailable for challenges.'
            });
          }
        } else {
          const challengedUserSocketId = userToSocketIdMap[challengedUserId];
          
          if (challengedUserSocketId) {
            console.log(`Sending challenge to ${challengedUserId}`);
            io.to(challengedUserSocketId).emit('challenge_received', {
              challengerUserId,
              challengerUsername: lobbyUsers[challengerUserId].username
            });
    
            lobbyUsers[challengedUserId].inPendingChallenge = true;
            lobbyUsers[challengerUserId].inPendingChallenge = true;
    
            io.emit('update_lobby', lobbyUsers);
          }
        }
      } else {
        console.log('Challenged user not found in lobby');
      }
    });
    

    socket.on('accept_challenge', async (data) => {
      const { challengedUserId, challengerUserId } = data;
    
      // Check if both the challenger and the challenged user are in the lobby
      if (lobbyUsers.hasOwnProperty(challengerUserId) && lobbyUsers.hasOwnProperty(challengedUserId)) {
        const challengerUserSocketId = userToSocketIdMap[challengerUserId];
        const challengedUserSocketId = userToSocketIdMap[challengedUserId];
    
        // Ensure that both users have valid socket IDs
        if (challengerUserSocketId && challengedUserSocketId) {
          console.log(`Challenge accepted by ${challengedUserId}, notifying ${challengerUserId}`);
    
          // Create a new room for the game
          const roomId = `room-${challengerUserId}-${challengedUserId}`;
          
          // Initialize or update the game state for this room
          createGame(roomId, [challengerUserId, challengedUserId]);
    
          // Join both the challenger and the challenged user to the room
          io.sockets.sockets.get(challengerUserSocketId)?.join(roomId);
          io.sockets.sockets.get(challengedUserSocketId)?.join(roomId);
    
          // Notify both users about the room creation
          io.to(roomId).emit('room_ready', { roomId });
    
          // Remove users from the lobbyUsers object
          delete lobbyUsers[challengerUserId];
          delete lobbyUsers[challengedUserId];
    
          // Update the lobby for all users
          io.emit('update_lobby', lobbyUsers);
        } else {
          console.log(`One of the users does not have a valid socket ID`);
        }
      } else {
        console.log('One of the users is not found in the lobby');
      }
    });

    socket.on('cancel_challenge', (data) => {
      const { challengedUserId, challengerUserId } = data;
     
      lobbyUsers[challengedUserId].inPendingChallenge = false;
      lobbyUsers[challengerUserId].inPendingChallenge = false;
  
      io.emit('update_lobby', lobbyUsers);
      io.to(userToSocketIdMap[challengedUserId]).emit('challenge_canceled', { challengerUserId, message: 'Challenger has canceled the challenge request' });
  });
  

    socket.on('reject_challenge', (data) => {
      const { challengedUserId, challengerUserId } = data;
      
      lobbyUsers[challengedUserId].inPendingChallenge = false;
      lobbyUsers[challengerUserId].inPendingChallenge = false;

      io.emit('update_lobby', lobbyUsers);
      io.to(userToSocketIdMap[challengerUserId]).emit('challenge_rejected', { challengedUserId, message: 'Challenge rejected' });
    });

    
  socket.on('player_ready', async (data) => {
    const { playerId, roomId, ships } = data;
    console.log(ships)
    const gameState = getGameState(roomId);

    let username;

    if (gameState) {
      gameState.setPlayerReady(playerId);
      console.log(`Player ${playerId} is ready in room ${roomId}`);

      gameState.updateBoard(playerId, undefined, ships);

      // Notify the room that this player is ready
      try {
        const user = await findUserById(playerId);
        if (user) {
         username = user.username;
        }
      } catch (error) {
        console.error('Error fetching user from database:', error);
      }

      // get opponent socket id
      const opponent = gameState.getOpponent(playerId);
      const opponentSocketId = opponent ? userToSocketIdMap[opponent]! : undefined!;

      io.to(opponentSocketId).emit('opponent_ready', { username });

      // Check if all players are ready
      if (gameState.allPlayersReady()) {
        // Emit an event to signal both players to move to the game room
        gameState.currentTurn = gameState.chooseRandomPlayer();
        let currentPlayerTurn = gameState.currentTurn;
        io.to(roomId).emit('all_players_ready', { roomId, currentPlayerTurn });
      }
    }
  });

  socket.on('reset_ships', (data) => {
    const { playerId, roomId } = data;
    const gameState = getGameState(roomId);
    const opponent = gameState?.getOpponent(playerId);
    const opponentSocketId = opponent ? userToSocketIdMap[opponent]! : undefined!;


    if (gameState && gameState?.checkIfPlayerReady(playerId)) {
      gameState.updateBoard(playerId, undefined, {});
      console.log(getGameState(roomId)?.playerBoards[playerId])
      io.to(opponentSocketId).emit('opponent_reset', { playerId });
    }
  });

  socket.on('shot_called', async (data) => {
    console.log('shot_called event received');
    console.log(data)
    const { square, roomId, currentPlayerId } = data;
    const gameState = getGameState(roomId);


    if (gameState && square && currentPlayerId !== undefined) {
      const opponent = gameState.getOpponent(currentPlayerId);

      if (gameState.checkIfHit(opponent, square)) {
        if(gameState.checkIfSunk(opponent, square)) {
          if(gameState.checkIfAllShipsSunk(opponent)) {
            console.log('game over ' + currentPlayerId)
            let username;
            try {
              const user = await findUserById(currentPlayerId);
              if (user) {
               username = user.username;
              }
            } catch (error) {
              console.error('Error fetching user from database:', error);
            }

            io.to(roomId).emit('game_over', { winner: username, winnerId: currentPlayerId, message: '' });
            io.to(roomId).emit('shot_hit', { square, currentPlayerTurn: '' });
            deleteGameState(roomId);
          } else {
              console.log('ship sunk')  
              gameState.switchPlayerTurn();
              let currentPlayerTurn = gameState.currentTurn;
              io.to(roomId).emit('ship_sunk', { square, currentPlayerTurn });
          }
        } else {
          console.log('shot hit')
          gameState.switchPlayerTurn();
          let currentPlayerTurn = gameState.currentTurn;
          io.to(roomId).emit('shot_hit', { square, currentPlayerTurn });
        }
      } else {
        console.log('shot miss')  
        gameState.updateBoard(opponent, square)
        gameState.switchPlayerTurn();
        let currentPlayerTurn = gameState.currentTurn;
        io.to(roomId).emit('shot_miss', { square, currentPlayerTurn });
      }
    }
  });

  socket.on('leave_game', async (data) => {
    console.log('leave_game event received');
    const { roomId, playerId, currentRoom } = data;
    console.log(roomId, playerId, currentRoom)
    const gameState = getGameState(roomId);
    const opponent = gameState?.getOpponent(playerId);
    const opponentSocketId = opponent ? userToSocketIdMap[opponent]! : undefined!;

    if (gameState) {
      // Remove the player from the game state
      gameState.removePlayer(playerId);

      // If the opponent is still in the room, notify them that they won
      if (opponent && currentRoom === '/game-room') {
        let username;
        try {
          const user = await findUserById(opponent);
          if (user) {
            username = user.username;
          }
        } catch (error) {
          console.error('Error fetching user from database:', error);
        }

        io.to(roomId).emit('game_over', { winner: username, winnerId: opponent, message: 'Opponent left - ' });
      } else {
        io.to(opponentSocketId).emit('game_cancelled', { message: 'Opponent left before the game started - No winner' });
      }

      // Delete the game state if both players have left
      if (gameState.players.length === 0) {
        deleteGameState(roomId);
        console.log(gameStates)
      }
      console.log("Game state after player left", gameStates)
    }
    
  });

    socket.on('disconnect', () => {
      if (socket.user?.id) {
        console.log(`user ${socket.user.id} disconnected`);
        delete lobbyUsers[socket.user.id];
        delete userToSocketIdMap[socket.user.id]; // Remove from user-to-socket mapping
      }
      io.emit('lobbyUpdate', lobbyUsers);
    });
  });
};
