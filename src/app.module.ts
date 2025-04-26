import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

// middlewares
import { LoggingMiddleware } from './midleware/system/logging.middleware';

// modules
import { ChatModule } from './modules/chat/chat.module';
import { DatabaseModule } from './data-base/database.module'; 

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get('LOCAL_MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    DatabaseModule,
    ChatModule
  ],
})

export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}