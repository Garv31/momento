import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  type: 'like' | 'comment' | 'follow';
  sender: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  post?: mongoose.Types.ObjectId;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      enum: ['like', 'comment', 'follow'],
      required: true,
    },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: Schema.Types.ObjectId, ref: 'Post' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);
