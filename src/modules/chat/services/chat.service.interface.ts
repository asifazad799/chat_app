import { Message } from '../entities/message.entity';

export interface IChatService {
  sendMessage(content: string, sender: string): Promise<Message>;
  getMessages(): Promise<Message[]>;
  getMessagesBySender({sender, limit, skip}:{sender: string,skip: number, limit: number }): Promise<Message[]>;
}