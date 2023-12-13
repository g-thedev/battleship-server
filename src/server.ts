import app from './app';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/battleship';

mongoose.connect(MONGO_URI)
.then(() => console.log('Connected to MongoDB'))
.catch((error) => { console.log('Could not connect to MongoDB', error) })


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

