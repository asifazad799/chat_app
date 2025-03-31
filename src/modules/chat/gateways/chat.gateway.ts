import {
    WebSocketGateway,
    WebSocketServer,
    MessageBody,
  } from '@nestjs/websockets';
  import { Server } from 'socket.io';
  import { RedisService } from '../../../services/redis/redis.service';
  
  @WebSocketGateway({ cors: true })
  export class ChatGateway {
    @WebSocketServer()
    server: Server;
  
    constructor(private readonly redisService: RedisService) { // Inject RedisService
      this.subscribeToRedis();
    }
  
    private subscribeToRedis(): void {
      this.redisService.subscribe('chat', (message: string) => {
        // Broadcast the message to all WebSocket clients
        this.server.emit('message', JSON.parse(message));
        console.log('message >>>>>>>>>>>>>>>>>>>',JSON.parse(message));
      });
    }
  
    async publishMessageToRedis(
      @MessageBody() data: { content: string; sender: string },
    ): Promise<void> {  
      // Publish the message to the Redis channel
      await this.redisService.publish('chat', JSON.stringify(data));
    }
  }