import { IsArray, IsOptional, IsString, IsUrl } from 'class-validator';
import { Transform } from 'class-transformer';
import { trimIfString } from '../../common/trim-if-string';

// Eventos válidos del sistema
export const VALID_EVENTS = [
  'student.enrolled',
  'student.unenrolled',
  'grade.submitted',
  'grade.updated',
  'session.started',
  'session.ended',
  'message.sent',
  'forum.thread.created',
  'forum.reply.created',
  'badge.awarded',
] as const;

export type WebhookEvent = (typeof VALID_EVENTS)[number];

export class CreateWebhookDto {
  @IsString()
  @Transform(trimIfString)
  name: string;

  @IsUrl()
  url: string;

  @IsOptional()
  @IsString()
  secret?: string;

  @IsArray()
  @IsString({ each: true })
  events: string[];

  @IsOptional()
  @IsString()
  courseId?: string;
}
