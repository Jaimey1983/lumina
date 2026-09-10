declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}

// Import de efecto lateral de una hoja de estilos de `node_modules` (p. ej.
// `katex/dist/katex.min.css` para el preview de fórmulas). El bundler la maneja;
// `tsc` solo necesita la declaración.
declare module "*.css";
