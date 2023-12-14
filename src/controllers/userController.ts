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


