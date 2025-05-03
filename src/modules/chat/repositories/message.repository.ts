import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { IMessageRepository } from './message.repository.interface';
import { Message } from '../entities/message.entity';
import { MessageDocument } from '../models/message.model';

@Injectable()
export class MessageRepository implements IMessageRepository {
  private messages: Message[] = [];

  constructor(
    @InjectModel('Message') 
    private readonly messageModel: Model<MessageDocument>, 
  ) {}

  async saveToDB(message: Message): Promise<Message> {
    const createdMessage = new this.messageModel(message);

    const savedMessage = await createdMessage.save();
    return savedMessage.toJSON();
  }

  async findBySender({sender, limit, skip}:{sender: string,skip: number, limit: number }): Promise<Message[]> {
    return this.messageModel
      .find({ sender })
      .skip(skip)
      .limit(limit)
      .sort({ timestamp: -1 });
  }

  async findAll(): Promise<Message[]> {
    return this.messages;
  }
}