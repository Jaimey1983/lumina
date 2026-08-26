import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { ServiceUnavailableException } from '@nestjs/common';
import { AiKeysService } from './ai-keys.service';
import { encryptApiKey } from './ai-crypto';

const MASTER = 'test-master-secret-32-chars-ok!!';
const PLATFORM = 'platform-gemini-key';

async function createService(
  env: Record<string, string | undefined>,
  prisma: object,
): Promise<AiKeysService> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      AiKeysService,
      { provide: PrismaClient, useValue: prisma },
      {
        provide: ConfigService,
        useValue: { get: (key: string) => env[key] },
      },
    ],
  }).compile();
  return module.get(AiKeysService);
}

describe('AiKeysService.resolveCredentials', () => {
  const userFindUnique = jest.fn();
  const prisma = { user: { findUnique: userFindUnique } };

  beforeEach(() => {
    userFindUnique.mockReset();
  });

  it('usa BYOK del proveedor preferido si hay clave', async () => {
    const service = await createService(
      { AI_KEYS_MASTER_SECRET: MASTER, GEMINI_API_KEY: PLATFORM },
      prisma,
    );
    const encrypted = encryptApiKey('sk-user-openai', MASTER, {
      userId: 'u1',
      provider: 'OPENAI',
    });
    userFindUnique.mockResolvedValueOnce({
      preferredAiProvider: 'OPENAI',
      teacherAiKeys: [{ provider: 'OPENAI', encryptedKey: encrypted }],
    });
    const creds = await service.resolveCredentials('u1');
    expect(creds).toEqual({
      provider: 'OPENAI',
      apiKey: 'sk-user-openai',
      source: 'byok',
    });
  });

  it('cae a Gemini de plataforma si no hay clave propia', async () => {
    const service = await createService(
      { AI_KEYS_MASTER_SECRET: MASTER, GEMINI_API_KEY: PLATFORM },
      prisma,
    );
    userFindUnique.mockResolvedValueOnce({
      preferredAiProvider: 'CLAUDE',
      teacherAiKeys: [],
    });
    const creds = await service.resolveCredentials('u1');
    expect(creds).toEqual({
      provider: 'GEMINI',
      apiKey: PLATFORM,
      source: 'platform',
    });
  });

  it('cae a plataforma si hay BYOK pero el secreto de cifrado no está listo', async () => {
    const service = await createService(
      { GEMINI_API_KEY: PLATFORM },
      prisma,
    );
    userFindUnique.mockResolvedValueOnce({
      preferredAiProvider: 'OPENAI',
      teacherAiKeys: [{ provider: 'OPENAI', encryptedKey: 'v2:opaque' }],
    });
    const creds = await service.resolveCredentials('u1');
    expect(creds).toEqual({
      provider: 'GEMINI',
      apiKey: PLATFORM,
      source: 'platform',
    });
  });

  it('503 si no hay BYOK ni fallback de plataforma', async () => {
    const service = await createService(
      { AI_KEYS_MASTER_SECRET: MASTER },
      prisma,
    );
    userFindUnique.mockResolvedValueOnce({
      preferredAiProvider: null,
      teacherAiKeys: [],
    });
    await expect(service.resolveCredentials('u1')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
