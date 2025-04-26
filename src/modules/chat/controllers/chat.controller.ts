import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  Get,
} from '@nestjs/common';
import { CreateMessageDto } from '../dtos/create-message.dto';
import { ChatService } from '../services/chat.service';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
  ) {}

  @Get('message')
  async getMessages() {
    return this.chatService.getMessages();
  }

  @Post('message')
  @UsePipes(new ValidationPipe({ transform: true }))
  async sendMessage(@Body() createMessageDto: CreateMessageDto): Promise<void> {
    await this.chatService.sendMessage(createMessageDto.content, createMessageDto.sender);
  }
}