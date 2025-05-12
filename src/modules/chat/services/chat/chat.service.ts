import { Inject, Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';

import { Message } from '../../entities/message.entity';

import { IChatService } from './chat.service.interface';
import { IMessageRepository } from '../../repositories/message.repository.interface';
import { IMessageRepositoryToken } from '../../repositories/message.repository.interface';
import { MessageDispatcherService } from '../dispatcher/messageDispatcher.service';
import { RedisService } from 'src/services/redis/redis.service';

import { REDIS_CHAT_KEY_PREFIX } from '../dispatcher/constants';

@Injectable()
export class ChatService implements IChatService {
  private readonly REDIS_CHAT_KEY_PREFIX = REDIS_CHAT_KEY_PREFIX;

  private readonly logger = new Logger(RedisService.name);
  private paginationLimit = 50;

  constructor(
    @Inject(IMessageRepositoryToken)
    private readonly messageRepository: IMessageRepository,
    private readonly messageDispatcherService: MessageDispatcherService,
    private readonly redisService: RedisService,
  ) {}

  async sendMessage(
    content: string,
    sender: string,
    roomId: string,
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
      this.logger.error(`send message handler failed`, error);
      throw error;
    }
  }

  async getAllMessages(): Promise<Message[]> {
    try {
      return await this.messageRepository.findAll();
    } catch (error) {
      this.logger.error(`get message handler failed`, error);
      throw error;
    }
  }

  async getMessagesBySender({
    sender,
    limit = this.paginationLimit,
    skip,
  }: {
    sender: string;
    skip: number;
    limit: number;
  }): Promise<Message[]> {
    try {
      return await this.messageRepository.findBySender({ sender, limit, skip });
    } catch (error) {
      this.logger.error(`get message by sender handler failed`, error);
      throw new Error(error);
    }
  }

  async getMessagesByRoomId({
    roomId,
    limit = this.paginationLimit,
    skip,
  }: {
    roomId: string;
    skip: number;
    limit: number;
  }): Promise<Message[] | null> {
    try {
      // override default value of 50 to incoming limit
      if (this.paginationLimit != limit) this.paginationLimit = limit;

      const messageFromRedis = await this.getMessageFromRedisByRoomId({
        roomId,
      });

      const messageFromDB = await this.messageRepository.findByRoomId({
        roomId,
        limit,
        skip,
      });

      return this.processMessages({ messageFromDB, messageFromRedis });
    } catch (error) {
      this.logger.error(`get message by roomId handler failed`, error);
      throw new Error(error);
    }
  }

  // private

  private async getMessageFromRedisByRoomId({ roomId }: { roomId: string }) {
    try {
      const key = `${this.REDIS_CHAT_KEY_PREFIX}::${roomId}`;

      const messages = await this.redisService.getValuesByPatterInOrder({
        key,
        start: 0,
        end: this.paginationLimit,
        parse: true,
      });

      return messages;
    } catch (error) {
      this.logger.error(`get message by roomId from redis failed`, error);
      throw new Error(error);
    }
  }

  // TODO: message proccessing logic should move to MessageProccessor class
  private stichMessagesFromRedisAndDB({
    messageFromDB,
    messageFromRedis,
  }: {
    messageFromDB: Message[];
    messageFromRedis: Message[];
  }) {
    try {
      const idWhereToStop = messageFromDB[0].id;
      const result: Message[] = [];

      const limit = this.paginationLimit;

      for (const message of messageFromRedis) {
        if (message.id < idWhereToStop || limit == result.length) {
          break;
        }

        result.push(message);
      }

      return [...result, ...messageFromDB];
    } catch (error) {
      this.logger.error(`stiching messages form Redis and DB failed`, error);
      throw new Error(error);
    }
  }

  private processMessages({
    messageFromDB,
    messageFromRedis,
  }: {
    messageFromDB: Message[];
    messageFromRedis: Message[];
  }): Message[] {
    try {
      if (messageFromDB.length == 0) return [];

      if (messageFromRedis.length == 0)
        return messageFromDB?.length > 0 ? messageFromDB : [];

      // both db and redis is same
      if (messageFromDB[0].id == messageFromRedis[0].id) {
        // TODO: clear all cache form redis
        return messageFromDB;
      }

      // redis have latest message
      if (messageFromRedis[0].id > messageFromDB[0].id) {
        // return immedietly if the redis message list lenght is pagination limit (50 or user passed limit)
        if (messageFromRedis?.length == this.paginationLimit)
          return messageFromRedis;

        // stiching messages form DB and Redis
        return this.stichMessagesFromRedisAndDB({
          messageFromDB,
          messageFromRedis,
        });
      }

      return messageFromDB;
    } catch (error) {
      this.logger.error(`proccessing messages failed`, error);
      throw new Error(error);
    }
  }
}
