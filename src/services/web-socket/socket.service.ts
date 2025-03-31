import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
  } from '@nestjs/websockets';
  import { Server } from 'socket.io';
  import { RedisService } from '../redis/redis.service';
  
  @WebSocketGateway({ cors: true })
  export class AppGateway {
    @WebSocketServer()
    server: Server;
  
    constructor(private readonly redisService: RedisService) {
      this.subscribeToRedis();
    }
  
    private subscribeToRedis(): void {
      // Subscribe to multiple channels if needed
      this.redisService.subscribe('chat', (message: string) => {
        this.handleIncomingMessage('chat', message);
      });
      
      // Add more subscriptions here for other modules
    }
  
    private handleIncomingMessage(channel: string, message: string): void {
      const parsed = JSON.parse(message);
      this.server.emit(channel, parsed);
      console.log(`[${channel}] message >>>`, parsed);
    }
  
    @SubscribeMessage('publish')
    async handlePublishMessage(
      @MessageBody() data: { channel: string; content: any },
    ): Promise<void> {
      await this.redisService.publish(
        data.channel, 
        JSON.stringify(data.content)
      );
    }
  }