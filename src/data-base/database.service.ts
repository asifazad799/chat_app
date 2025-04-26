import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @Inject(getConnectionToken()) private readonly connection: Connection,
  ) {}

  async onModuleInit() {
    if (this.connection.readyState === 1) {
      this.logger.log('✅ Successfully connected to MongoDB');
    } else {
      this.logger.warn(`MongoDB connection state: ${this.connection.readyState}`);

      this.connection.on('connected', () => {
        this.logger.log('✅ Successfully connected to MongoDB');
      });

      this.connection.on('error', (err) => {
        this.logger.error(`❌ MongoDB connection error: ${err.message}`, err.stack);
      });
    }
  }
}
