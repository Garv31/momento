import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  caption: string;
  images: string[];
  author: mongoose.Types.ObjectId;
  likes: mongoose.Types.ObjectId[];
  comments: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    caption: { type: String, default: '' },
    images: [{ type: String, required: true }],
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
  },
  { timestamps: true }
);

export default mongoose.models.Post ||
  mongoose.model<IPost>('Post', PostSchema);
