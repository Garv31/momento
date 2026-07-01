import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  name: string;
  bio: string;
  image: string;
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  savedPosts: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    bio: { type: String, default: '' },
    image: { type: String, default: '' },
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    savedPosts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
  },
  { timestamps: true }
);

export default mongoose.models.User ||
  mongoose.model<IUser>('User', UserSchema);
