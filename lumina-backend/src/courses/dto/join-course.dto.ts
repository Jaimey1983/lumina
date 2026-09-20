import { IsNotEmpty, IsString } from 'class-validator';

export class JoinCourseDto {
  @IsString({ message: 'El código del curso debe ser un texto' })
  @IsNotEmpty({ message: 'El código del curso es obligatorio' })
  code: string;
}
