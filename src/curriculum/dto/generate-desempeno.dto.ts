import { IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { trimIfString } from '../../common/trim-if-string';

export class GenerateDesempenoDto {
  @IsString()
  @Transform(trimIfString)
  area: string;

  @IsString()
  @Transform(trimIfString)
  grado: string;

  @IsString()
  @Transform(trimIfString)
  tema: string;

  @IsString()
  @Transform(trimIfString)
  tipo: string;
}
