import { Message } from '../entities/message.entity';

export const IMessageRepositoryToken = Symbol('IMessageRepository');
 
export interface IMessageRepository {
  saveToDB(message: Message): Promise<Message>;

  findAll(): Promise<Message[]>;

  findBySender({
    sender,
    limit,
    skip,
  }: {
    sender: string;
    skip: number;
    limit: number;
  }): Promise<Message[]>;

  findByRoomId({
    roomId,
    limit,
    skip,
  }: {
    roomId: string;
    skip: number;
    limit: number;
  }): Promise<Message[]>;
}