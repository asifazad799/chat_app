import { Schema } from 'mongoose';

export const MessageSchema = new Schema({
  content: { type: String, required: true },
  sender: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  batchId: { type: String, required: true },
});

export class Message {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
  batchId: string;
}

export type MessageDocument = Message & Document;