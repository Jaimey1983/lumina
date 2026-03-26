import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class ContentAssistantDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  topic: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(20)
  slideCount?: number;

  @IsOptional()
  @IsString()
  level?: 'beginner' | 'intermediate' | 'advanced';
}
