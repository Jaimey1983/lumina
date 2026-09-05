import { ServiceUnavailableException } from '@nestjs/common';
import {
  AI_PROVIDER_LABELS,
  LLM_MODELS,
  type AiProviderId,
  type LlmCredentials,
} from './ai-provider.types';

const DEFAULT_MAX_TOKENS = 4000;
const PING_MAX_TOKENS = 64;

function unavailable(provider: AiProviderId, extra?: string): never {
  const label = AI_PROVIDER_LABELS[provider];
  throw new ServiceUnavailableException(
    extra ? `${label} ${extra}` : `${label} no disponible.`,
  );
}

function throwHttpError(provider: AiProviderId, status: number): never {
  const label = AI_PROVIDER_LABELS[provider];
  if (status === 401 || status === 403) {
    throw new ServiceUnavailableException(
      `La clave de ${label} no es válida o no tiene permiso. Revísala en Mi perfil.`,
    );
  }
  if (status === 429) {
    throw new ServiceUnavailableException(
      `${label} rechazó la solicitud por límite de uso. Intenta más tarde.`,
    );
  }
  throw new ServiceUnavailableException(
    `${label} no disponible (HTTP ${status}). Intenta de nuevo más tarde.`,
  );
}

async function postJson(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  provider: AiProviderId,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
  } catch {
    unavailable(provider);
  }

  if (!response.ok) {
    await response.text().catch(() => undefined);
    throwHttpError(provider, response.status);
  }

  try {
    return JSON.parse(await response.text()) as unknown;
  } catch {
    unavailable(provider, 'devolvió una respuesta no JSON');
  }
}

function asRecord(data: unknown): Record<string, unknown> {
  return data !== null && typeof data === 'object'
    ? (data as Record<string, unknown>)
    : {};
}

function throwIfEmbeddedError(data: unknown, provider: AiProviderId): void {
  if (asRecord(asRecord(data).error).message) unavailable(provider);
}

function extractGemini(data: unknown): string {
  throwIfEmbeddedError(data, 'GEMINI');
  const rec = asRecord(data);
  const candidates = rec.candidates;
  if (!Array.isArray(candidates)) return '';
  const content = asRecord(candidates[0]).content;
  const parts = asRecord(content).parts;
  if (!Array.isArray(parts)) return '';
  const text = asRecord(parts[0]).text;
  return typeof text === 'string' ? text : '';
}

function extractOpenAi(data: unknown): string {
  throwIfEmbeddedError(data, 'OPENAI');
  const rec = asRecord(data);
  const choices = rec.choices;
  if (!Array.isArray(choices)) return '';
  const message = asRecord(asRecord(choices[0]).message);
  return typeof message.content === 'string' ? message.content : '';
}

function extractClaude(data: unknown): string {
  throwIfEmbeddedError(data, 'CLAUDE');
  const rec = asRecord(data);
  const content = rec.content;
  if (!Array.isArray(content)) return '';
  const blocks: unknown[] = content;
  const block: unknown = blocks.find((c: unknown) => {
    const item = asRecord(c);
    return item.type === 'text' || typeof item.text === 'string';
  });
  const text = asRecord(block).text;
  return typeof text === 'string' ? text : '';
}

export async function completeJson(
  creds: LlmCredentials,
  systemInstruction: string,
  userMessage: string,
  maxTokens = DEFAULT_MAX_TOKENS,
): Promise<string> {
  const { provider, apiKey } = creds;

  if (provider === 'GEMINI') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${LLM_MODELS.GEMINI}:generateContent`;
    return extractGemini(
      await postJson(
        url,
        { 'x-goog-api-key': apiKey },
        {
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: userMessage }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: maxTokens,
            responseMimeType: 'application/json',
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_NONE',
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_NONE',
            },
          ],
        },
        provider,
      ),
    );
  }

  if (provider === 'OPENAI') {
    return extractOpenAi(
      await postJson(
        'https://api.openai.com/v1/chat/completions',
        { Authorization: `Bearer ${apiKey}` },
        {
          model: LLM_MODELS.OPENAI,
          temperature: 0.7,
          max_tokens: maxTokens,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userMessage },
          ],
        },
        provider,
      ),
    );
  }

  if (provider === 'CLAUDE') {
    return extractClaude(
      await postJson(
        'https://api.anthropic.com/v1/messages',
        { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        {
          model: LLM_MODELS.CLAUDE,
          max_tokens: maxTokens,
          temperature: 0.7,
          system: systemInstruction,
          messages: [{ role: 'user', content: userMessage }],
        },
        provider,
      ),
    );
  }

  const _never: never = provider;
  throw new ServiceUnavailableException(
    `Proveedor no soportado: ${String(_never)}`,
  );
}

export async function pingProvider(creds: LlmCredentials): Promise<void> {
  const raw = await completeJson(
    creds,
    'Responde SIEMPRE con JSON válido. Sin markdown.',
    'Devuelve exactamente {"ok":true}',
    PING_MAX_TOKENS,
  );
  if (!raw.trim()) {
    unavailable(
      creds.provider,
      'respondió vacío. La clave puede ser inválida.',
    );
  }
}
