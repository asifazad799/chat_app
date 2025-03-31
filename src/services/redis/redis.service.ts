import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private pubClient: RedisClientType;
  private subClient: RedisClientType;

  constructor() {
    this.pubClient = createClient({ url: 'redis://redis:6379' });
    this.subClient = this.pubClient.duplicate();
  }

  async onModuleInit() {
    await this.pubClient.connect();
    await this.subClient.connect();
    console.log('Connected to Redis');
  }

  async onModuleDestroy() {
    await this.pubClient.quit();
    await this.subClient.quit();
    console.log('Disconnected from Redis');
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