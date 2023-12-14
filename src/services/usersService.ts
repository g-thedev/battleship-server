import User from '../models/userModel';

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
    return newUser;
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
