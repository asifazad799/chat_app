import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private pubClient: RedisClientType;
  private subClient: RedisClientType;
  private readonly logger = new Logger(RedisService.name);
  
  constructor() {
    this.pubClient = createClient({ url: 'redis://redis:6379' });
    this.subClient = this.pubClient.duplicate();

        
    // Add error listeners
    this.pubClient.on('error', (err) => 
      this.logger.error('Pub Client Error', err));
    this.subClient.on('error', (err) => 
      this.logger.error('Sub Client Error', err));
    this.subClient.on('connect', () => 
      this.logger.log('Subscriber connected'));
    this.subClient.on('ready', () => 
      this.logger.log('Subscriber ready'));
    this.subClient.on('end', () => 
      this.logger.warn('Subscriber disconnected'));
  }

  async onModuleInit() {
    await this.pubClient.connect();
    await this.subClient.connect();
    this.logger.log('Connected to Redis');
  }

  async onModuleDestroy() {
    await this.pubClient.quit();
    await this.subClient.quit();
    this.logger.log('Disconnected from Redis');
  }

  getPubClient(): RedisClientType {
    return this.pubClient;
  }

  getSubClient(): RedisClientType {
    return this.subClient;
  }

  async publish(channel: string, message: string): Promise<void> {
    await this.pubClient.publish(channel, message);
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    await this.subClient.subscribe(channel, callback);
  }
}