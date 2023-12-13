import { Request, Response } from 'express';
import User from '../models/userModel';

// Get all users
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
        try {
            const users = await User.find();
            res.status(200).json(users);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    };

// Get a single user by ID
export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new user
export const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = new User({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
        });
        const newUser = await user.save();
        res.status(201).json(newUser);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Update an existing user
export const updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
       const user = await User.findById(req.params.id);
       if(user) {
              user.username = req.body.username || user.username;
              user.email = req.body.email || user.email;
              user.password = req.body.password || user.password;
    
              const updatedUser = await user.save();
              res.status(200).json(updatedUser);
       } else {
              res.status(404).json({ message: 'User not found' });
       }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a user
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (user) {
            res.status(200).json({ message: 'User deleted' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};


