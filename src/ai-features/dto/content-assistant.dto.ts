import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { trimIfString } from '../../common/trim-if-string';

export class ContentAssistantDto {
  @IsString()
  @Transform(trimIfString)
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
