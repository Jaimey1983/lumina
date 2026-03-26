import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendDirectMessageDto {
  @IsString()
  @IsNotEmpty()
  body: string;

  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}
