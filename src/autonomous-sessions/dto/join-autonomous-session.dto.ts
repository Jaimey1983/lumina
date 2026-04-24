import { IsString } from 'class-validator';

export class JoinAutonomousSessionDto {
  @IsString()
  studentName: string;

  @IsString()
  pin: string;
}
