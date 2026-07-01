import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  text: string;
  author: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    text: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Comment ||
  mongoose.model<IComment>('Comment', CommentSchema);
