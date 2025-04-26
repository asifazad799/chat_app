import { Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { MessageDocument } from '../models/message.model';

import { RedisService } from '../../../services/redis/redis.service';
import { SocketService } from 'src/services/web-socket/socket.service';
import { KafkaService } from 'src/services/kafka/kafka.service';

import { CreateMessageDto } from '../dtos/create-message.dto';
import { KAFKA, REDIS_EVENTS } from 'src/services/web-socket/constants';

@Injectable()
export class ChatGateway {
  private readonly logger = new Logger(ChatGateway.name);

  private readonly CHAT_TOPIC = KAFKA.topic.chatTopic;
  private readonly MAX_RETRIES = KAFKA.maxRetry;
  private readonly RETRY_DELAY = KAFKA.retryDelay;

  constructor(
    private readonly redisService: RedisService, 
    private readonly socketService : SocketService,
    private readonly kafkaService: KafkaService,
    @InjectModel('Message') private readonly messageModel: Model<MessageDocument>, 
  ) {}

  async onModuleInit() {
    await this.redisService.subscribe(REDIS_EVENTS.chat, (message) => {
      this.handleRedisMessage(message);
    });

    // KAFKA
    await this.kafkaService.subscribeToTopic(this.CHAT_TOPIC);
    await this.kafkaService.runBatchProcessor({
      eachBatchAutoResolve: true,
      eachBatch: async ({ batch, heartbeat, resolveOffset }) => {
        const messages = batch.messages.map((msg) => {
          const parsed = JSON.parse(msg?.value?.toString() || '');
          return {
            content: parsed.content,
            sender: parsed.sender,
            timestamp: new Date(parsed.timestamp),
            batchId: parsed.batchId,
          };
        });

        try {
          await this.kafkaService.retryOperation(
            async () => {
              await this.messageModel.insertMany(messages, { ordered: false });
            },
            this.MAX_RETRIES,
            this.RETRY_DELAY
          );

          batch.messages.forEach((message) => resolveOffset(message.offset));
          await heartbeat();
        } catch (error) {
          this.logger.error('Failed processing batch', error);
        }
      },
    });
  }

  // REDIS
  private handleRedisMessage(message: string) {
    try {
      const parsed = JSON.parse(message);
      this.socketService.publish({message, event: REDIS_EVENTS.chat, room: parsed?.roomId});
    } catch (error) {
      console.error('Error parsing Redis message', error);
      throw new Error(error);
    }
  }

  async publishMessageToRedis(
    data: CreateMessageDto
  ): Promise<void> {
    try {
      const payload = JSON.stringify({
        ...data,
        timestamp: new Date().toISOString()
      });
      
      await this.redisService.publish(REDIS_EVENTS.chat, payload);
    } catch (error) {
      this.logger.error(`Redis publish failed`, error.stack);
      throw new Error('Message publishing failed');
    }
  }
}