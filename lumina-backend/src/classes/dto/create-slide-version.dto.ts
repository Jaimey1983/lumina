import { IsObject } from 'class-validator';

export class CreateSlideVersionDto {
  @IsObject()
  content!: Record<string, unknown>;
}
