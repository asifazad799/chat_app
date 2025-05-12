import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private pubClient: RedisClientType;
  private subClient: RedisClientType;
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly configService: ConfigService) {
    this.pubClient = createClient({ url: this.configService.get('REDIS_URI') });
    this.subClient = this.pubClient.duplicate();

    // Add error listeners
    this.pubClient.on('error', (err) =>
      this.logger.error('Pub Client Error', err),
    );
    this.subClient.on('error', (err) =>
      this.logger.error('Sub Client Error', err),
    );
    this.subClient.on('connect', () => this.logger.log('Subscriber connected'));
    this.subClient.on('ready', () => this.logger.log('Subscriber ready'));
    this.subClient.on('end', () => this.logger.warn('Subscriber disconnected'));
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

  async subscribe(
    channel: string,
    callback: (message: string) => void,
  ): Promise<void> {
    await this.subClient.subscribe(channel, callback);
  }

  async setCache({
    key,
    ttlSeconds,
    value,
  }: {
    key: string;
    value: any;
    ttlSeconds: number;
  }): Promise<void> {
    try {
      await this.pubClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
      this.logger.log(`Cache set for key "${key}" with TTL ${ttlSeconds}s`);
    } catch (err) {
      this.logger.error(`Failed to set cache for key "${key}"`, err);
    }
  }

  async getCache<T = any>({ key }: { key: string }): Promise<T | null> {
    try {
      const data = await this.pubClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      this.logger.error(`Failed to get cache for key "${key}"`, err);
      return null;
    }
  }

  async pushValuesInOrder({
    key,
    value,
    ttlSeconds,
  }: {
    key: string;
    value: any;
    ttlSeconds: number;
  }): Promise<void> {
    const stringified = JSON.stringify(value);

    await this.pubClient.lPush(key, stringified);

    const ttl = await this.pubClient.ttl(key);
    if (ttl === -1) {
      await this.pubClient.expire(key, ttlSeconds);
    }
  }

  async getValuesByPatterInOrder({
    key,
    start = 0,
    end = -1,
    parse = true,
  }: {
    key: string;
    start?: number;
    end?: number;
    parse?: boolean;
  }): Promise<any[]> {
    const values = await this.pubClient.lRange(key, start, end);

    if (!parse) return values;

    return values.map((item) => {
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    });
  }

  async scanKeys(pattern: string): Promise<string[]> {
    const client = this.pubClient; // or this.pubClient
    const foundKeys: string[] = [];
    let cursor = 0;

    do {
      const result = await client.scan(cursor, {
        MATCH: pattern,
        COUNT: 100, // You can adjust this batch size
      });

      cursor = Number(result.cursor);
      foundKeys.push(...result.keys);
    } while (cursor !== 0);

    return foundKeys;
  }

  async getValuesByPattern(
    pattern: string,
    onlyValues = false,
  ): Promise<Record<string, any> | any[]> {
    const keys = await this.scanKeys(pattern);

    const values = await Promise.all(
      keys.map((key) => this.pubClient.get(key)),
    );

    const parsedValues = values.map((val) => {
      try {
        return val ? JSON.parse(val) : val;
      } catch {
        return val;
      }
    });

    return onlyValues
      ? parsedValues
      : keys.reduce(
          (acc, key, i) => {
            acc[key] = parsedValues[i];
            return acc;
          },
          {} as Record<string, any>,
        );
  }
}
