import { ServiceUnavailableException } from '@nestjs/common';
import { completeJson } from './ai-providers';
import type { LlmCredentials } from './ai-provider.types';

function mockFetchOk(payload: unknown) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify(payload)),
  });
}

describe('completeJson — adaptadores por proveedor', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('Gemini extrae text de candidates[0].content.parts[0]', async () => {
    mockFetchOk({
      candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }],
    });
    const creds: LlmCredentials = {
      provider: 'GEMINI',
      apiKey: 'gem-key',
      source: 'platform',
    };
    await expect(completeJson(creds, 'sys', 'user')).resolves.toBe(
      '{"ok":true}',
    );
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      { method: string; headers: Record<string, string> },
    ];
    expect(url).toContain('generativelanguage.googleapis.com');
    expect(url).toContain('gemini-2.5-flash-lite');
    expect(url).not.toContain('key=');
    expect(url).not.toContain('gem-key');
    expect(init.method).toBe('POST');
    expect(
      (init as { headers: Record<string, string> }).headers['x-goog-api-key'],
    ).toBe('gem-key');
  });

  it('OpenAI extrae choices[0].message.content', async () => {
    mockFetchOk({
      choices: [{ message: { content: '{"ok":true}' } }],
    });
    const creds: LlmCredentials = {
      provider: 'OPENAI',
      apiKey: 'sk-test',
      source: 'byok',
    };
    await expect(completeJson(creds, 'sys', 'user')).resolves.toBe(
      '{"ok":true}',
    );
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      { headers: Record<string, string> },
    ];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect(init.headers.Authorization).toBe('Bearer sk-test');
  });

  it('Claude extrae content[].text', async () => {
    mockFetchOk({
      content: [{ type: 'text', text: '{"ok":true}' }],
    });
    const creds: LlmCredentials = {
      provider: 'CLAUDE',
      apiKey: 'claude-key',
      source: 'byok',
    };
    await expect(completeJson(creds, 'sys', 'user')).resolves.toBe(
      '{"ok":true}',
    );
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      { headers: Record<string, string> },
    ];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect(init.headers['x-api-key']).toBe('claude-key');
  });

  it('401 no incluye el cuerpo del proveedor en el mensaje', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      text: () =>
        Promise.resolve('{"error":"invalid_api_key sk-leaked-secret"}'),
    });
    const creds: LlmCredentials = {
      provider: 'OPENAI',
      apiKey: 'sk-leaked-secret',
      source: 'byok',
    };
    let thrownError: Error | undefined;
    try {
      await completeJson(creds, 'sys', 'user');
    } catch (err) {
      thrownError = err as Error;
    }
    expect(thrownError).toBeInstanceOf(ServiceUnavailableException);
    expect(thrownError?.message).toMatch(/clave de OpenAI no es válida/);
    expect(thrownError?.message).not.toContain('sk-leaked-secret');
  });
});
