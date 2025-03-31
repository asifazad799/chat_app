import { Message } from '../entities/message.entity';

export const IMessageRepositoryToken = Symbol('IMessageRepository');
 
export interface IMessageRepository {
  save(message: Message): Promise<Message>;
  findAll(): Promise<Message[]>;
  findBySender(sender: string): Promise<Message[]>;
}