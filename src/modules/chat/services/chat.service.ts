import { Inject, Injectable } from '@nestjs/common';
import { IChatService } from './chat.service.interface';
import { IMessageRepository } from '../repositories/message.repository.interface';
import { Message } from '../entities/message.entity';
import { IMessageRepositoryToken } from '../repositories/message.repository.interface';
import { ChatGateway } from '../gateways/chat.gateway';

@Injectable()
export class ChatService implements IChatService {
  constructor(
    @Inject(IMessageRepositoryToken) private readonly messageRepository: IMessageRepository,
    private readonly chatGateway: ChatGateway,
  )
  {}

  async sendMessage(content: string, sender: string): Promise<Message> {
    const message: Message = {
      id: Math.random().toString(36).substring(7), // Generate a random ID
      content,
      sender,
      timestamp: new Date(),
      batchId: Math.random().toString(36).substring(8)
    };

    // publish message to redis
    await this.chatGateway.publishMessageToRedis(message);

    // implement kafka before saving to db
    return await this.messageRepository.save(message);
  }

  async getMessages(): Promise<Message[]> {
    return await this.messageRepository.findAll();
  }

  async getMessagesBySender({sender, limit, skip}:{sender: string,skip: number, limit: number }): Promise<Message[]> {
    return await this.messageRepository.findBySender({sender, limit, skip});
  }
}