import { Inject, Injectable } from '@nestjs/common';

import { Message } from '../entities/message.entity';

import { IChatService } from './chat.service.interface';
import { IMessageRepository } from '../repositories/message.repository.interface';
import { IMessageRepositoryToken } from '../repositories/message.repository.interface';
import { ChatGateway } from '../gateways/chat.gateway';
import { KafkaService } from 'src/services/kafka/kafka.service';
import { Types } from 'mongoose';

@Injectable()
export class ChatService implements IChatService {
  private readonly TOPIC = 'chat-topic';

  constructor(
    @Inject(IMessageRepositoryToken)
    private readonly messageRepository: IMessageRepository,
    private readonly chatGateway: ChatGateway,
    private readonly kafkaService: KafkaService,
  ) {}

  async sendMessage(
    content: string,
    sender: string,
  ): Promise<{ status: boolean }> {
    try {
      const message: Message = {
        id: new Types.ObjectId(),
        content,
        sender,
        timestamp: new Date(),
        batchId: Math.random().toString(36).substring(8),
      };

      // publish message to redis will ensure users gets message on real-time
      await this.pushMessageToRedis({ message });

      // pushing message to kafka will ensure throughput
      await this.pushMessageToKafka({ message });

      return { status: true };
    } catch (error) {
      // log error
      throw error;
    }
  }

  private async pushMessageToKafka({ message }: { message: Message }) {
    return await this.kafkaService.pushMessage({ topic: this.TOPIC, message });
  }

  private async pushMessageToRedis({ message }: { message: Message }) {
    return await this.chatGateway.publishMessageToRedis(message);
  }

  async getMessages(): Promise<Message[]> {
    try {
      return await this.messageRepository.findAll();
    } catch (error) {
      // log error
      throw error;
    }
  }

  async getMessagesBySender({
    sender,
    limit,
    skip,
  }: {
    sender: string;
    skip: number;
    limit: number;
  }): Promise<Message[]> {
    return await this.messageRepository.findBySender({ sender, limit, skip });
  }
}
