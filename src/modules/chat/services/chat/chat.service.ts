import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';

import { Message } from '../../entities/message.entity';

import { IChatService } from './chat.service.interface';
import { IMessageRepository } from '../../repositories/message.repository.interface';
import { IMessageRepositoryToken } from '../../repositories/message.repository.interface';
import { MessageDispatcherService } from '../dispatcher/messageDispatcher.service';

@Injectable()
export class ChatService implements IChatService {
  constructor(
    @Inject(IMessageRepositoryToken)
    private readonly messageRepository: IMessageRepository,
    private readonly messageDispatcherService: MessageDispatcherService,
  ) {}

  async sendMessage(
    content: string,
    sender: string,
    roomId: string
  ): Promise<{ status: boolean }> {
    try {
      const message: Message = {
        id: new Types.ObjectId(),
        content,
        sender,
        timestamp: new Date().toISOString(),
        batchId: Math.random().toString(36).substring(8),
        roomId,
      };

      await this.messageDispatcherService.dispatchMessage({ message });

      return { status: true };
    } catch (error) {
      // log error
      throw error;
    }
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
