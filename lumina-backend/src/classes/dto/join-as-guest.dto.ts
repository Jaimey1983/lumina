import { IsString, MinLength } from 'class-validator';

export class JoinAsGuestDto {
  @IsString()
  @MinLength(1)
  nombre: string;
}
