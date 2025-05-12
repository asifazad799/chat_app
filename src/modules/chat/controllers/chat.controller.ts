import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  Get,
} from '@nestjs/common';

import {
  CreateMessageDto,
  GetMessagesByRoomIdDto,
} from '../dtos/create-message.dto';

import { ChatService } from '../services/chat/chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('message')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getMessages(@Body() body: GetMessagesByRoomIdDto) {
    return this.chatService.getMessagesByRoomId(body);
  }

  @Post('message')
  @UsePipes(new ValidationPipe({ transform: true }))
  async sendMessage(
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<{ status: boolean }> {
    try {
      return await this.chatService.sendMessage(
        createMessageDto.content,
        createMessageDto.sender,
        createMessageDto.roomId,
      );
    } catch (error) {
      return { status: false };
    }
  }
}