import express, { Router } from 'express';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser, loginUser, refreshToken } from '../controllers/userController';

const router: Router = express.Router();

// Route to get all users
router.get('/', getAllUsers);

// Route to get a single user by ID
router.get('/:id', getUserById);

// Route to create a new user
router.post('/', createUser);

// Route to login a user
router.post('/login', loginUser);

// Route to refresh token
router.post('/refresh', refreshToken);

// Route to update an existing user
router.put('/:id', updateUser);

// Route to delete a user
router.delete('/:id', deleteUser);

export default router;
