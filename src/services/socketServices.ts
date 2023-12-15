import { Server as SocketIOServer } from 'socket.io';
import { attachAuthenticationMiddleware } from '../middleware/socketMiddleware';
import { findUserById } from './usersService';

export const setupWebSocket = (httpServer: any) => {
  const CLIENT_URL = process.env.CLIENT_ORIGIN;
  
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: CLIENT_URL, // Client URL
      methods: ["GET", "POST"],
      allowedHeaders: ["my-custom-header"],
      credentials: true
    }
  });

  // Attach the authentication middleware
  attachAuthenticationMiddleware(io);

  const lobbyUsers: { [key: string]: any } = {};

  io.on('connection', async (socket) => {

    if (socket.user?.id) {
      console.log(`user ${socket.user.id} connected`);
      try {
        // Query the database for the user
        const user = await findUserById(socket.user.id);
        if (user) {
          // Add user to lobby with additional details (e.g., username)
          lobbyUsers[socket.user.id] = { id: user.id, username: user.username };
        }
      } catch (error) {
        console.error('Error fetching user from database:', error);
      }
    }

    io.emit('lobbyUpdate', lobbyUsers);

    socket.on('disconnect', () => {
      if (socket.user && socket.user.id) {
        console.log(`user ${socket.user.id} disconnected`);
        // Remove user from lobby
        delete lobbyUsers[socket.user.id];
      }
      io.emit('lobbyUpdate', lobbyUsers);
    });
  });
};
