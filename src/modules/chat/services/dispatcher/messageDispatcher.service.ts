import { Injectable } from '@nestjs/common';

import { KafkaService } from 'src/services/kafka/kafka.service';
import { RedisService } from 'src/services/redis/redis.service';

import { Message } from '../../entities/message.entity';

import { REDIS_EVENTS, KAFKA } from '../../../../constants';
import { IMessageDispatcher } from './messageDispatcher.service.interface';
import { REDIS_CHAT_KEY_PREFIX } from './constants';

@Injectable()
export class MessageDispatcherService implements IMessageDispatcher {
  private readonly KAFKA_TOPIC = KAFKA.topic.chatTopic;
  private readonly REDIS_CHAT_KEY_PREFIX = REDIS_CHAT_KEY_PREFIX;

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
  ) {}

  private async publishMessageToRedis({
    message,
  }: {
    message: Message;
  }): Promise<void> {
    try {
      const payload = JSON.stringify(message);

      return await this.redisService.publish(REDIS_EVENTS.chat, payload);
    } catch (error) {
      throw new Error('Message publishing failed', error);
    }
  }

  private async cacheMessageOnRedis({ message }: { message: Message }) {
    try {
      return await this.redisService.pushValuesInOrder({
        key: `${this.REDIS_CHAT_KEY_PREFIX}::${message.roomId}`,
        ttlSeconds: 60 * 60 * 2,
        value: message,
      });
    } catch (error) {
      throw new Error('Message cache failed', error);
    }
  }

  public async dispatchMessage({ message }: { message: Message }) {
    try {
      // pushing message to kafka will ensure throughput
      await this.kafkaService.pushMessage({ topic: this.KAFKA_TOPIC, message });

      // cache messages to redis with a minimum ttl of 1 min,
      // to ensure real-time coz of latest messages are in the
      // kafka queue to be proccessed for 300ms or whatever the kafka batch interval.
      await this.cacheMessageOnRedis({ message });

      // publish message to redis will ensure users gets message
      // even though the users are on different main server
      // on horzontal scalling.
      await this.publishMessageToRedis({ message });

      return Promise.resolve({ success: true });
    } catch (error) {
      throw new Error('Meeage dispatch failed', error);
    }
  }
}
