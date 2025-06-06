import { Types } from 'mongoose';

export class Message {
  id: Types.ObjectId;
  content: string;
  sender: string;
  timestamp: Date | string;
  batchId: string;
  roomId: string;
}
