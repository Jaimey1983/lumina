import { IsString } from 'class-validator';

export class AssignActivityDto {
  @IsString()
  activityId: string;
}
