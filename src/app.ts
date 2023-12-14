import express, {Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Import routes
import userRoutes from './routes/userRoutes';

// set cors options
const whitelist = ['http://localhost:3000', 'http://localhost:5173/'];
const corsOptions = {
    origin: whitelist,
    optionsSuccessStatus: 200
};

const app: Application = express();

// Middleware
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Remove once setup in production
app.use((req, res, next) => {
    console.log(`Request from ${req.ip} for ${req.url}`);
    next();
  });

// Use routes
app.use('/users', userRoutes);

// TODO: Remove this route
app.get('/', (req: Request, res: Response) => {
    res.send('Hello World with TypeScript!');
  });
  
// TODO: Remove this route
app.get('/data', (req: Request, res: Response) => {
res.json({ data: "Hello Gerard" });
});


export default app;