import { IsArray, IsBoolean, IsOptional, IsString, IsUrl } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateWebhookDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  name?: string;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsString()
  secret?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  events?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
