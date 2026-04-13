import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ResultItemDto {
  @IsString()
  studentId: string;

  @IsString()
  slideId: string;

  @IsString()
  activityType: string;

  @IsNumber()
  @Min(0)
  score: number;

  @IsNumber()
  @Min(0)
  maxScore: number;

  @IsOptional()
  response?: any;
}

export class GuardarResultadosDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResultItemDto)
  resultados: ResultItemDto[];
}
