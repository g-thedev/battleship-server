import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';

// JWT secret key
const SECRET_KEY = process.env.JWT_SECRET; // Replace with your secret key

// Middleware for Socket.IO to authenticate the JWT
const authenticateToken = (socket: any, next: Function) => {
    
    const token = socket.handshake.auth.token;
    

    if (!SECRET_KEY) {
        return next(new Error('Authentication error'));
    }
    
    jwt.verify(token, SECRET_KEY, (err: Error | null, decodedToken: any) => { // Explicitly type 'err' as 'Error | null'
        if (err) {
            return next(new Error('Authentication error'));
        }
        socket.user = decodedToken; // Assign the decoded token to the socket
        next();
    });
};

// Function to attach the middleware to a Socket.IO server
export const attachAuthenticationMiddleware = (io: SocketIOServer) => {
  io.use(authenticateToken);
};
