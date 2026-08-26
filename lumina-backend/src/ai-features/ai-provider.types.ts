export const AI_PROVIDERS = ['GEMINI', 'OPENAI', 'CLAUDE'] as const;
export type AiProviderId = (typeof AI_PROVIDERS)[number];

export const AI_PROVIDER_LABELS: Record<AiProviderId, string> = {
  GEMINI: 'Google Gemini',
  OPENAI: 'OpenAI',
  CLAUDE: 'Anthropic Claude',
};

export type LlmKeySource = 'byok' | 'platform';

export interface LlmCredentials {
  provider: AiProviderId;
  apiKey: string;
  source: LlmKeySource;
}

export const LLM_MODELS: Record<AiProviderId, string> = {
  GEMINI: 'gemini-2.5-flash-lite',
  OPENAI: 'gpt-4o-mini',
  CLAUDE: 'claude-3-5-haiku-20241022',
};
