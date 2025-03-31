import { Injectable } from '@nestjs/common';
import { IMessageRepository } from './message.repository.interface';
import { Message } from '../entities/message.entity';

@Injectable()
export class MessageRepository implements IMessageRepository {
  private messages: Message[] = [];

  async save(message: Message): Promise<Message> {
    this.messages.push(message);
    return message;
  }

  async findAll(): Promise<Message[]> {
    return this.messages;
  }

  async findBySender(sender: string): Promise<Message[]> {
    return this.messages.filter((message) => message.sender === sender);
  }
}