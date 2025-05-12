import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  sender: string;

  @IsString()
  @IsNotEmpty()
  roomId: string;
}

export class GetMessagesDto {
  @IsString()
  @IsNotEmpty()
  sender: string;

  @IsNumber()
  @Min(0)
  skip: number;

  @IsNumber()
  @Min(1)
  limit: number;
}

export class GetMessagesByRoomIdDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsNumber()
  @Min(0)
  skip: number;

  @IsNumber()
  @Min(1)
  limit: number;
}