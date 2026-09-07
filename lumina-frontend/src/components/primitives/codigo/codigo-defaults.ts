import type { CodeBlock } from '@lumina/types/slide';

export function createDefaultCodeBlock(extra?: Partial<CodeBlock>): CodeBlock {
  return {
    tipo: 'codigo',
    codigo: '// Escribe tu código aquí\nconsole.log("Hola mundo");',
    lenguaje: 'javascript',
    mostrarNumeroLineas: true,
    ...extra,
  };
}
