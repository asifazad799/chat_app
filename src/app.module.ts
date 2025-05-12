import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

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
    DatabaseModule,
    ChatModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}