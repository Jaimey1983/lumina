import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, Matches } from 'class-validator';

const DOMAIN_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

export class CreateTrustedDomainDto {
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string'
      ? value.trim().toLowerCase().replace(/^@/, '')
      : value,
  )
  @Matches(DOMAIN_RE, { message: 'Dominio inválido (ej: colegio.edu.co).' })
  domain: string;

  @IsOptional()
  @IsBoolean()
  autoVerify?: boolean;
}
