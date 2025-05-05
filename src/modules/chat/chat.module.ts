import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { RedisService } from '../../services/redis/redis.service';
import { ChatService } from './services/chat/chat.service';
import { SocketService } from 'src/services/web-socket/socket.service';
import { KafkaService } from 'src/services/kafka/kafka.service';

import { ChatGateway } from './gateways/chat.gateway';
import { MessageRepository } from './repositories/message.repository';
import { IMessageRepositoryToken } from './repositories/message.repository.interface';

import { MessageSchema } from './models/message.model';

import { ChatController } from './controllers/chat.controller';
import { MessageDispatcherService } from './services/dispatcher/messageDispatcher.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Message', schema: MessageSchema }]),
  ],
  controllers: [ChatController],
  providers: [
    ChatGateway,
    RedisService,
    ChatService,
    SocketService,
    KafkaService,
    MessageDispatcherService,
    {
      provide: IMessageRepositoryToken,
      useClass: MessageRepository,
    },
  ],
})
export class ChatModule {}