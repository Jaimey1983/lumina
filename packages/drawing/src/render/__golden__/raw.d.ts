// Los golden se leen como texto con `?raw` (Vite/Vitest), sin depender de `node:fs` ni de `@types/node`.
declare module '*?raw' {
  const contenido: string;
  export default contenido;
}
