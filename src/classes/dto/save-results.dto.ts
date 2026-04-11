import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class StudentResultDto {
  @IsString()
  studentId: string;

  @IsString()
  slideId: string;

  @IsString()
  activityType: string;

  @IsOptional()
  @IsBoolean()
  correct?: boolean | null;

  @IsArray()
  historial: any[];
}

export class SaveResultsDto {
  @IsString()
  sessionId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentResultDto)
  results: StudentResultDto[];
}
