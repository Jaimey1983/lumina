import { IsObject, IsOptional, IsString } from 'class-validator';

export class TriggerWebhookDto {
  @IsString()
  event: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;
}
