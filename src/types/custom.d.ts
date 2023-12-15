import { Socket as OriginalSocket } from 'socket.io';

// Extending the Socket interface from Socket.IO
declare module 'socket.io' {
  interface Socket {
    user?: { id: string; [key: string]: any }; // Define the structure of user
  }
}
