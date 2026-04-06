import { IsString, MinLength } from 'class-validator';

export class JoinLiveDto {
  @IsString()
  @MinLength(1, { message: 'classId es obligatorio' })
  classId: string;
}
