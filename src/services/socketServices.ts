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

  io.on('connection', async (socket) => {
    if (socket.user?.id) {
      console.log(`user ${socket.user.id} connected`);
      
      // Add the user's socket ID to the mapping
      userToSocketIdMap[socket.user.id] = socket.id;

      try {
        const user = await findUserById(socket.user.id);
        if (user) {
          lobbyUsers[socket.user.id] = { id: user.id, username: user.username, socketId: socket.id };
        }
      } catch (error) {
        console.error('Error fetching user from database:', error);
      }
    }

    io.emit('update_lobby', lobbyUsers);

    socket.on('request_challenge', async (data) => {
      const { challengedUserId, challengerUserId } = data;
      
      if (lobbyUsers.hasOwnProperty(challengedUserId)) {
        const challengedUserSocketId = userToSocketIdMap[challengedUserId];
        
        if (challengedUserSocketId) {
          console.log(`Sending challenge to ${challengedUserId}`);
          io.to(challengedUserSocketId).emit('challenge_received', {
            challengerUserId,
            challengerUsername: lobbyUsers[challengerUserId].username
          });
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
    
  socket.on('player_ready', (data) => {
    const { playerId, roomId, ships } = data;
    console.log(ships)
    const gameState = getGameState(roomId);

    if (gameState) {
      gameState.playerReady(playerId);
      console.log(`Player ${playerId} is ready in room ${roomId}`);

      gameState.updateBoard(playerId, undefined, ships);

      // Notify the room that this player is ready
      io.to(roomId).emit('opponent_ready', { playerId });

      // Check if all players are ready
      if (gameState.allPlayersReady()) {
        // Emit an event to signal both players to move to the game room
        io.to(roomId).emit('all_players_ready', { roomId });
      }
    }
  });

  socket.on('reset_ships', (data) => {
    const { playerId, roomId } = data;
    const gameState = getGameState(roomId);

    if (gameState) {
      gameState.updateBoard(playerId, undefined, {});
      console.log(getGameState(roomId)?.playerBoards[playerId])
      io.to(roomId).emit('opponent_reset', { playerId });
    }
  });

  socket.on('leave_game', (data) => {
    console.log('leave_game event received');
    const { roomId, playerId, currentRoom } = data;
    console.log(roomId, playerId, currentRoom)
    const gameState = getGameState(roomId);
    const opponent = gameState?.getOpponent(playerId);
    const opponentSocketId = opponent ? userToSocketIdMap[opponent] : undefined;
    console.log(gameState)

    if (gameState) {
      // Remove the player from the game state
      gameState.removePlayer(playerId);

      // Remove the player from the room
      if (opponentSocketId) {
        io.to(opponentSocketId).emit('opponent_left', { opponent });
      }

      // If the opponent is still in the room, notify them that they won
      if (opponent && currentRoom === 'game-room') {
        io.to(roomId).emit('game_over', { winner: opponent });
      } else {
        console.log(getGameState(roomId))
        io.to(roomId).emit('game_cancelled', { winner: 'No winner' });
      }

      // Delete the game state if both players have left
      if (gameState.players.length === 0) {
        deleteGameState(roomId);
        console.log(gameStates)
      }
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
