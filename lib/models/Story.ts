import mongoose, { Schema, Document } from 'mongoose';

export interface IStory extends Document {
  image: string;
  author: mongoose.Types.ObjectId;
  viewers: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const StorySchema = new Schema<IStory>(
  {
    image: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    viewers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export default mongoose.models.Story ||
  mongoose.model<IStory>('Story', StorySchema);
