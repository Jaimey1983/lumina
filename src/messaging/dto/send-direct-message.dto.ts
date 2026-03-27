import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendDirectMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}
