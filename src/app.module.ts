import { Module, OnModuleInit, Logger, Inject, MiddlewareConsumer } from '@nestjs/common';
import { Connection } from 'mongoose';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

// modules
import { ChatModule } from './modules/chat/chat.module';
import { LoggingMiddleware } from './midleware/system/logging.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    ChatModule
  ],
})
export class AppModule implements OnModuleInit {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*'); // Apply to all routes
  }

  private readonly logger = new Logger(AppModule.name);
  
  constructor(
    // Inject the mongoose connection that NestJS is managing
    @Inject(getConnectionToken()) private connection: Connection
  ) {}

  async onModuleInit() {
    // Check if the connection is ready
    if (this.connection.readyState === 1) {
      this.logger.log('✅ Successfully connected to MongoDB'); 
    } else {
      this.logger.warn(`MongoDB connection state: ${this.connection.readyState}`);
      
      // Add listeners for future state changes
      this.connection.on('connected', () => {
        this.logger.log('✅ Successfully connected to MongoDB');
      });
      
      this.connection.on('error', (err) => {
        this.logger.error(`❌ MongoDB connection error: ${err.message}`, err.stack);
      });
    }
  }
}