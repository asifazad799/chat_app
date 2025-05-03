import { Injectable, Logger } from '@nestjs/common';

import { RedisService } from '../../../services/redis/redis.service';
import { SocketService } from 'src/services/web-socket/socket.service';

import { CreateMessageDto } from '../dtos/create-message.dto';
import { REDIS_EVENTS } from 'src/services/web-socket/constants';

@Injectable()
export class ChatGateway {
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly redisService: RedisService, 
    private readonly socketService : SocketService,
  ) {}

  async onModuleInit() {
    await this.redisService.subscribe(REDIS_EVENTS.chat, (message) => {
      this.publishMessageToSocket(message);
    });
  }

  // REDIS
  private publishMessageToSocket(message: string) {
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