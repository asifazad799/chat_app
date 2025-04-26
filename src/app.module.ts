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
    // ClientsModule.register([
    //   {
    //     name: 'KAFKA_SERVICE',
    //     transport: Transport.KAFKA,
    //     options: {
    //       client: {
    //         brokers: ['localhost:9092'],
    //       },
    //       consumer: {
    //         groupId: 'nest-consumer-group',
    //       },
    //     },
    //   },
    // ]),
    DatabaseModule,
    ChatModule
  ],
})

export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}