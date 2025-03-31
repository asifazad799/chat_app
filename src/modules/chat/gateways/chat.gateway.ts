import { Injectable, Logger } from '@nestjs/common';

import { RedisService } from '../../../services/redis/redis.service';
import { SocketSerive } from 'src/services/web-socket/socket.service';

import { CreateMessageDto } from '../dtos/create-message.dto';

@Injectable()
export class ChatGateway {
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly redisService: RedisService, 
    private readonly socketSerive : SocketSerive
  ) {}

  async onModuleInit() {
    await this.redisService.subscribe('chat', (message) => {
      this.handleRedisMessage(message);
    });
  }

  private handleRedisMessage(message: string) {
    try {
      this.socketSerive.sendMessage(message, 'message');
    } catch (err) {
      console.error('Error parsing Redis message', err);
    }
  }

  async publishMessage(
     data: CreateMessageDto
  ): Promise<void> {
    try {
      const payload = JSON.stringify({
        ...data,
        timestamp: new Date().toISOString()
      });
      
      await this.redisService.publish('chat', payload);
    } catch (error) {
      this.logger.error(`Redis publish failed`, error.stack);
      throw new Error('Message publishing failed');
    }
  }
}