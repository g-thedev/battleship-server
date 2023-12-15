import { Request, Response } from 'express';
import * as userService from '../services/usersService';

// Get all users
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await userService.findAllUsers();
        res.status(200).json(users);
    } catch (error: any) {
        console.error("Error fetching users:", error);

        res.status(500).json({ message: error.message });
    }
};

// Get a single user by ID
export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await userService.findUserById(req.params.id);
        res.status(200).json(user);
    } catch (error: any) {
        if (error.message === 'User not found') {
            res.status(404).json({ message: error.message });
        } else {
        res.status(500).json({ message: error.message });
        }
    }
};

// Create a new user
export const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const newUser = await userService.createUser(req.body);
        res.status(201).json(newUser);
    } catch (error: any) {
        console.error("Error creating new user:", error);

        res.status(500).json({ message: error.message });
    }
};

// Login a user
export const loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate req.body before using it
        if (!req.body.username || !req.body.password) {
            res.status(400).json({ message: 'Username and password are required' });
            return;
        }
    
        const {token, user_id} = await userService.loginUser(req.body);
        res.status(200).json({ token, user_id });
    } catch (error: unknown) {
        // Check if error is an object with a message property before accessing it
        if (typeof error === 'object' && error !== null && 'message' in error) {
          if (error.message === 'User not found' || error.message === 'Incorrect password') {
            res.status(401).json({ message: error.message });
          } else {
            res.status(500).json({ message: error.message });
          }
        } else {
          // If error is not an object with a message property, send a generic error message
          res.status(500).json({ message: 'An error occurred' });
        }
    }
};

// refresh token
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const oldRefreshToken: string = req.headers['x-refresh-token'] as string;
        const token = await userService.refreshToken(oldRefreshToken);
        res.status(200).json({ token });
    } catch (error: any) {
        if (error.message === 'User not found' || error.message === 'Incorrect password') {
            res.status(401).json({ message: error.message });
        } else {
        res.status(500).json({ message: error.message });
        }
    }
};

// Update an existing user
export const updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const updatedUser = await userService.updateUser(req.params.id, req.body);
        res.status(200).json(updatedUser);
    } catch (error: any) {
        if (error.message === 'User not found') {
            res.status(404).json({ message: error.message });
        } else {
        res.status(500).json({ message: error.message });
        }
    }
};

// Delete a user
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        await userService.deleteUser(req.params.id);
        res.status(200).json({ message: 'User successfully deleted' });
    } catch (error: any) {
        if (error.message === 'User not found') {
            res.status(404).json({ message: error.message });
        }  else {
        res.status(500).json({ message: error.message });
        }
    }
};


