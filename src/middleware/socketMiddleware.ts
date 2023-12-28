import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET;

const authenticateToken = (socket: any, next: Function) => {
    
    const token = socket.handshake.auth.token;
    

    if (!SECRET_KEY) {
        return next(new Error('Authentication error'));
    }
    
    jwt.verify(token, SECRET_KEY, (err: Error | null, decodedToken: any) => {
        if (err) {
            return next(new Error('Authentication error'));
        }
        socket.user = decodedToken; 
        next();
    });
};

export const attachAuthenticationMiddleware = (io: SocketIOServer) => {
  io.use(authenticateToken);
};
