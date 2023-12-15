import dotenv from 'dotenv';

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import app from './app';
import mongoose from 'mongoose';
import http from 'http';
import { setupWebSocket } from './services/socketServices';

const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;

const server = http.createServer(app);

if (!MONGO_URI) {
  throw new Error('MONGO_URI is not defined');
}

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => { console.log('Could not connect to MongoDB', error) });


setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

