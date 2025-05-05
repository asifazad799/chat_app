import { Injectable, Logger } from '@nestjs/common';

import { KafkaService } from 'src/services/kafka/kafka.service';
import { RedisService } from 'src/services/redis/redis.service';

import { Message } from '../../entities/message.entity';

import { REDIS_EVENTS, KAFKA } from '../../../../constants';
import { IMessageDispatcher } from './messageDispatcher.service.interface';

@Injectable()
export class MessageDispatcherService implements IMessageDispatcher {
  private readonly KAFKA_TOPIC = KAFKA.topic.chatTopic;
  private readonly logger = new Logger(RedisService.name);

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
      this.logger.error(`Redis publish failed`, error.stack);
      throw new Error('Message publishing failed');
    }
  }

  private async cacheMessageOnRedis({ message }: { message: Message }) {
    try {
      const payload = JSON.stringify(message);

      return await this.redisService.setCache({
        key: `chat-chate::${message.roomId}::${message.id}`,
        ttlSeconds: 60 * 60 * 2,
        value: payload,
      });
    } catch (error) {
      this.logger.error(`Redis cache failed`, error.stack);
      throw new Error('Message cache failed');
    }
  }

  public async dispatchMessage({ message }: { message: Message }) {
    try {
      // publish message to redis will ensure users gets message on real-time
      await this.kafkaService.pushMessage({ topic: this.KAFKA_TOPIC, message });

      // cache messages to redis with a minimum ttl of 1 min
      await this.cacheMessageOnRedis({ message });

      // pushing message to kafka will ensure throughput
      await this.publishMessageToRedis({ message });

      return Promise.resolve({ success: true });
    } catch (error) {
      this.logger.error(`Redis publish failed`, error.stack);
      throw new Error('Message publishing failed');
    }
  }
}
