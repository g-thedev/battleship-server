import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const SECRET_KEY = process.env.JWT_SECRET;

declare module 'express-serve-static-core' {
    interface Request {
        user?: any;
    }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.split(' ')[1]; 

    if (!token) {
        return res.status(401).send('Access denied. No token provided.');
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY as string);
        req.user = decoded;
        next();
    } catch (ex) {
        res.status(400).send('Invalid token.');
    }
};
