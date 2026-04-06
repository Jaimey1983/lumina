import { IsString } from 'class-validator';

export class AssignBadgeDto {
  @IsString()
  userId: string;
}
