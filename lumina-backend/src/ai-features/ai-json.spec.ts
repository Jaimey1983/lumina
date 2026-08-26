import { parseLlmJsonObject } from './ai-json';

const SAMPLE = {
  title: 'La fotosíntesis',
  slides: [{ order: 1, tipo: 'portada', title: 'Inicio' }],
};

describe('parseLlmJsonObject — contrato de salida v2 (cualquier proveedor)', () => {
  it('acepta JSON puro (OpenAI json_object)', () => {
    expect(parseLlmJsonObject(JSON.stringify(SAMPLE))).toEqual(SAMPLE);
  });

  it('acepta fences ```json de Gemini/Claude', () => {
    const raw = `\`\`\`json\n${JSON.stringify(SAMPLE)}\n\`\`\``;
    expect(parseLlmJsonObject(raw)).toEqual(SAMPLE);
  });

  it('acepta fences genéricos ```', () => {
    const raw = `\`\`\`\n${JSON.stringify(SAMPLE)}\n\`\`\``;
    expect(parseLlmJsonObject(raw)).toEqual(SAMPLE);
  });

  it('devuelve {} si no es un objeto (array, texto, JSON inválido)', () => {
    expect(parseLlmJsonObject('[1,2]')).toEqual({});
    expect(parseLlmJsonObject('no es json')).toEqual({});
    expect(parseLlmJsonObject('')).toEqual({});
  });

  it('el mismo objeto de clase se parsea igual desde los tres formatos de proveedor', () => {
    const openai = JSON.stringify(SAMPLE);
    const gemini = `\`\`\`json\n${JSON.stringify(SAMPLE)}\n\`\`\``;
    const claude = `  \`\`\`\n${JSON.stringify(SAMPLE)}\n\`\`\`  `;
    expect(parseLlmJsonObject(openai)).toEqual(parseLlmJsonObject(gemini));
    expect(parseLlmJsonObject(gemini)).toEqual(parseLlmJsonObject(claude));
  });
});
