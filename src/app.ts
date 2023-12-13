import express, {Application, Request, Response } from 'express';

// Import routes
import userRoutes from './routes/userRoutes';

const app: Application = express();

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