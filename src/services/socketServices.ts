import { Server as SocketIOServer } from 'socket.io';
import { attachAuthenticationMiddleware } from '../middleware/socketMiddleware';
import { findUserById } from './usersService';

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
    
          // Notify the challenger that the challenge was accepted
          io.to(challengerUserSocketId).emit('challenge_accepted', {
            challengedUserId,
            challengedUsername: lobbyUsers[challengedUserId].username
          });
    
          // Create a new room for the game
          const roomName = `room-${challengerUserId}-${challengedUserId}`;
          // Join both the challenger and the challenged user to the room
          io.sockets.sockets.get(challengerUserSocketId)?.join(roomName);
          io.sockets.sockets.get(challengedUserSocketId)?.join(roomName);
    
          // Notify both users about the room creation
          io.to(roomName).emit('room-created', roomName);
        } else {
          console.log(`One of the users does not have a valid socket ID`);
        }
      } else {
        console.log('One of the users is not found in the lobby');
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
