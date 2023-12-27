import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

interface IUser extends Document {
  username: string;
  password: string;
  comparePassword: (password: string) => Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
});

// Hash password before saving to database
UserSchema.pre('save', async function (next) {
    const user = this as IUser;
    if (user.isModified('password') || user.isNew) {
        try {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(user.password, salt);
            user.password = hash;
            next();
        } catch (error: any) {
            next(error);
        }
    } else {
        return next();
    }
});

// Compare password to hashed password
UserSchema.methods.comparePassword = async function (password: string) {
    try {
        const user = this as IUser;
        return await bcrypt.compare(password, user.password);
    } catch (error: any) {
        throw new Error(error);
    }
};

export default mongoose.model<IUser>('User', UserSchema);
