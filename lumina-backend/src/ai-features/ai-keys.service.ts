import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiProvider, PrismaClient } from '@prisma/client';
import {
  AI_KEYS_MIN_SECRET_LEN,
  apiKeyHint,
  assertSafeApiKey,
  decryptApiKey,
  encryptApiKey,
  isStrongMasterSecret,
} from './ai-crypto';
import {
  AI_PROVIDER_LABELS,
  AI_PROVIDERS,
  type AiProviderId,
  type LlmCredentials,
} from './ai-provider.types';
import { completeJson, pingProvider } from './ai-providers';

const DECRYPT_FAIL =
  'No se pudo usar la clave guardada. Vuelve a guardarla en Mi perfil.';

export interface AiProviderStatusDto {
  provider: AiProviderId;
  label: string;
  configured: boolean;
  keyHint: string | null;
  lastVerifiedAt: string | null;
}

export interface AiSettingsDto {
  preferredProvider: AiProviderId | null;
  resolvedProvider: AiProviderId | null;
  resolvedSource: LlmCredentials['source'] | null;
  platformFallbackAvailable: boolean;
  encryptionReady: boolean;
  providers: AiProviderStatusDto[];
}

@Injectable()
export class AiKeysService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly config: ConfigService,
  ) {}

  private masterSecret(): string | undefined {
    const secret = this.config.get<string>('AI_KEYS_MASTER_SECRET')?.trim();
    return isStrongMasterSecret(secret) ? secret : undefined;
  }

  private requireMasterSecret(): string {
    const secret = this.masterSecret();
    if (!secret) {
      throw new ServiceUnavailableException(
        `AI_KEYS_MASTER_SECRET no está configurada o es demasiado débil (mínimo ${AI_KEYS_MIN_SECRET_LEN} caracteres, sin placeholders). No se pueden guardar ni usar claves propias.`,
      );
    }
    return secret;
  }

  private platformGeminiKey(): string | undefined {
    return this.config.get<string>('GEMINI_API_KEY')?.trim() || undefined;
  }

  private requireSafeApiKey(apiKey: string) {
    try {
      assertSafeApiKey(apiKey);
    } catch (err: unknown) {
      throw new BadRequestException(
        err instanceof Error ? err.message : 'Clave no válida',
      );
    }
  }

  private decryptOwnedKey(
    userId: string,
    provider: AiProvider,
    encryptedKey: string,
  ): string {
    try {
      return decryptApiKey(encryptedKey, this.requireMasterSecret(), {
        userId,
        provider,
      });
    } catch {
      throw new ServiceUnavailableException(DECRYPT_FAIL);
    }
  }

  async getSettings(userId: string): Promise<AiSettingsDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        preferredAiProvider: true,
        teacherAiKeys: {
          select: { provider: true, keyHint: true, lastVerifiedAt: true },
        },
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const keysByProvider = new Map(
      user.teacherAiKeys.map((k) => [k.provider as AiProviderId, k]),
    );
    const preferred = (user.preferredAiProvider as AiProviderId | null) ?? null;
    const secretOk = Boolean(this.masterSecret());
    const platformFallbackAvailable = Boolean(this.platformGeminiKey());
    const preferredOrGemini = preferred ?? 'GEMINI';

    let resolvedProvider: AiProviderId | null = null;
    let resolvedSource: LlmCredentials['source'] | null = null;
    if (keysByProvider.has(preferredOrGemini) && secretOk) {
      resolvedProvider = preferredOrGemini;
      resolvedSource = 'byok';
    } else if (platformFallbackAvailable) {
      resolvedProvider = 'GEMINI';
      resolvedSource = 'platform';
    }

    return {
      preferredProvider: preferred,
      resolvedProvider,
      resolvedSource,
      platformFallbackAvailable,
      encryptionReady: secretOk,
      providers: AI_PROVIDERS.map((provider) => {
        const stored = keysByProvider.get(provider);
        return {
          provider,
          label: AI_PROVIDER_LABELS[provider],
          configured: Boolean(stored),
          keyHint: stored?.keyHint ?? null,
          lastVerifiedAt: stored?.lastVerifiedAt?.toISOString() ?? null,
        };
      }),
    };
  }

  async resolveCredentials(userId: string): Promise<LlmCredentials> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        preferredAiProvider: true,
        teacherAiKeys: {
          select: { provider: true, encryptedKey: true },
        },
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const preferred =
      (user.preferredAiProvider as AiProviderId | null) ?? 'GEMINI';
    const own = user.teacherAiKeys.find((k) => k.provider === preferred);
    const secret = this.masterSecret();

    // Sin secreto fuerte no se puede descifrar: mismo criterio que getSettings.
    if (own && secret) {
      try {
        return {
          provider: preferred,
          apiKey: decryptApiKey(own.encryptedKey, secret, {
            userId,
            provider: preferred,
          }),
          source: 'byok',
        };
      } catch {
        throw new ServiceUnavailableException(DECRYPT_FAIL);
      }
    }

    const platform = this.platformGeminiKey();
    if (platform) {
      return { provider: 'GEMINI', apiKey: platform, source: 'platform' };
    }

    const label = AI_PROVIDER_LABELS[preferred];
    throw new ServiceUnavailableException(
      preferred === 'GEMINI'
        ? 'No hay clave de Gemini. Configura tu clave en Mi perfil o pide a un administrador que configure GEMINI_API_KEY.'
        : `No hay clave de ${label} y el fallback de plataforma no está disponible. Configura tu clave en Mi perfil.`,
    );
  }

  async setPreferredProvider(
    userId: string,
    provider: AiProvider,
  ): Promise<AiSettingsDto> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { preferredAiProvider: provider },
    });
    return this.getSettings(userId);
  }

  async saveKey(
    userId: string,
    provider: AiProvider,
    apiKey: string,
  ): Promise<AiSettingsDto> {
    const secret = this.requireMasterSecret();
    this.requireSafeApiKey(apiKey);
    const encryptedKey = encryptApiKey(apiKey, secret, { userId, provider });
    const keyHint = apiKeyHint(apiKey);

    await this.prisma.$transaction([
      this.prisma.teacherAiKey.upsert({
        where: { userId_provider: { userId, provider } },
        create: { userId, provider, encryptedKey, keyHint },
        update: { encryptedKey, keyHint, lastVerifiedAt: null },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { preferredAiProvider: provider },
      }),
    ]);

    return this.getSettings(userId);
  }

  async deleteKey(userId: string, provider: AiProvider): Promise<AiSettingsDto> {
    const result = await this.prisma.teacherAiKey.deleteMany({
      where: { userId, provider },
    });
    if (result.count === 0) {
      throw new NotFoundException(
        `No hay clave guardada para ${AI_PROVIDER_LABELS[provider as AiProviderId]}`,
      );
    }
    return this.getSettings(userId);
  }

  async testKey(
    userId: string,
    provider: AiProvider,
    apiKeyFromBody?: string,
  ): Promise<{ ok: true; provider: AiProviderId }> {
    const providerId = provider as AiProviderId;
    let creds: LlmCredentials;

    if (apiKeyFromBody) {
      this.requireSafeApiKey(apiKeyFromBody);
      creds = { provider: providerId, apiKey: apiKeyFromBody, source: 'byok' };
    } else {
      const stored = await this.prisma.teacherAiKey.findUnique({
        where: { userId_provider: { userId, provider } },
      });
      if (!stored) {
        throw new NotFoundException(
          `No hay clave guardada para ${AI_PROVIDER_LABELS[providerId]}`,
        );
      }
      creds = {
        provider: providerId,
        apiKey: this.decryptOwnedKey(userId, provider, stored.encryptedKey),
        source: 'byok',
      };
    }

    await pingProvider(creds);

    if (!apiKeyFromBody) {
      await this.prisma.teacherAiKey.update({
        where: { userId_provider: { userId, provider } },
        data: { lastVerifiedAt: new Date() },
      });
    }

    return { ok: true, provider: providerId };
  }

  async completeForUser(
    userId: string,
    systemInstruction: string,
    userMessage: string,
  ): Promise<string> {
    const creds = await this.resolveCredentials(userId);
    try {
      return await completeJson(creds, systemInstruction, userMessage);
    } catch (err: unknown) {
      if (err instanceof ServiceUnavailableException) throw err;
      throw new ServiceUnavailableException(
        `${AI_PROVIDER_LABELS[creds.provider]} no disponible.`,
      );
    }
  }
}
