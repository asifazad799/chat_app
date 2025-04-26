import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  Get,
} from '@nestjs/common';
import { CreateMessageDto, GetMessagesDto } from '../dtos/create-message.dto';
import { ChatService } from '../services/chat.service';
import { Message } from '../entities/message.entity';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
  ) {}

  @Get('message')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getMessages(@Body() body: GetMessagesDto) {
    return this.chatService.getMessagesBySender(body);
  }

  @Post('message')
  @UsePipes(new ValidationPipe({ transform: true }))
  async sendMessage(@Body() createMessageDto: CreateMessageDto): Promise<Message> {
    const res = await this.chatService.sendMessage(createMessageDto.content, createMessageDto.sender);
    return res;
  }
}