import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

export class InstitutionalEmailDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : '',
  )
  @IsEmail()
  email: string;
}
