import { Schema, Types } from 'mongoose';

export const MessageSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, default: () => new Types.ObjectId() },
  content: { type: String, required: true },
  sender: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  batchId: { type: String, required: true },
});

export class Message {
  id: Types.ObjectId;
  content: string;
  sender: string;
  timestamp: Date;
  batchId: string;
}

export type MessageDocument = Message & Document;
