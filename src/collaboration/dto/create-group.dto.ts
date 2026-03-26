import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateGroupDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  description?: string;
}
