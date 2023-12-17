import User from '../models/userModel';
import jwt from 'jsonwebtoken';

// Service to get all users
export const findAllUsers = async () => {
  try {
    const users = await User.find();
    return users;
  } catch (error) {
    throw error;
  }
};

// Service to get a single user by ID
export const findUserById = async (userId: String) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  } catch (error) {
    throw error;
  }
};

// Service to create a new user
export const createUser = async (userData: {username: String; email: String; password: String}) => {
  try {
    const newUser = new User({
        username: userData.username,
        email: userData.email,
        password: userData.password,
    });
    await newUser.save();
    return generateTokens(newUser._id);;
  } catch (error) {
    throw error;
  }
};

// Service to login a user
export const loginUser = async (userData: {username: String; password: String}) => {
    try {
        const user = await User.findOne({ username: userData.username });
        if (!user) {
            throw new Error('User not found');
        }

        const isMatch = await user.comparePassword(userData.password as string);
        if (!isMatch) {
            throw new Error('Incorrect password');
        }

        return { token: generateTokens(user._id), user_id: user._id};
    } catch (error) {
        throw error;
    }
  };

// Service to update a user
export const updateUser = async (userId: string, updateData: { username?: string; email?: string; password?: string }) => {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
  
      // Update fields
      if (updateData.username) user.username = updateData.username;
      if (updateData.email) user.email = updateData.email;
      if (updateData.password) user.password = updateData.password;
  
     
      await user.save();
  
      return user; 
    } catch (error) {
      throw error;
    }
  };

// Service to delete a user
export const deleteUser = async (userId: string) => {
  try {
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      throw new Error('User not found');
    }
    return deletedUser;
  } catch (error) {
    throw error;
  }
};

const generateTokens = (userId: string) => {
    const JWT_SECRET = process.env.JWT_SECRET;
    const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
    
    if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
        throw new Error('JWT_SECRET or JWT_REFRESH_SECRET is not defined');
      }
      
      const accessToken = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '15m' });
      const refreshToken = jwt.sign({ id: userId }, JWT_REFRESH_SECRET, { expiresIn: '30d' });
    
      return { accessToken, refreshToken };
};

export const refreshToken = async (tokenString: string) => {

  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

  if (!JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  let token;
  try {
    // Parse the token string to an object
    token = JSON.parse(tokenString);
  } catch (parseError) {
    throw new Error('Error parsing token');
  }

  try {
    const decoded = jwt.verify(token.refresh, JWT_REFRESH_SECRET) as any;

    // Generate new tokens
    const { accessToken, refreshToken } = generateTokens(decoded.id);
    return { accessToken, refreshToken };

  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};