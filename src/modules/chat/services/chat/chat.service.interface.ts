import { Message } from '../../entities/message.entity';

export interface IChatService {
  sendMessage(
    content: string,
    sender: string,
    roomId: string,
  ): Promise<{ status: boolean }>;

  getAllMessages(): Promise<Message[]>;

  getMessagesBySender({
    sender,
    limit,
    skip,
  }: {
    sender: string;
    skip: number;
    limit: number;
  }): Promise<Message[]>;

  getMessagesByRoomId({
    roomId,
    limit,
    skip,
  }: {
    roomId: string;
    skip: number;
    limit: number;
  }): Promise<Message[] | null>;
}
