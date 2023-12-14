import dotenv from 'dotenv';

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import app from './app';
import mongoose from 'mongoose';

const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error('MONGO_URI is not defined');
}

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => { console.log('Could not connect to MongoDB', error) });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

