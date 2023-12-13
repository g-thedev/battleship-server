import express, { Request, Response } from 'express';

const app = express();

app.get('/', (req: Request, res: Response) => {
    res.send('Hello World with TypeScript!');
  });
  
  
  app.get('/data', (req: Request, res: Response) => {
    res.json({ data: "Hello Gerard" });
  });


export default app;