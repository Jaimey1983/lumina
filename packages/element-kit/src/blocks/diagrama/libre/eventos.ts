// ─── Eventos del visor del diagrama (W9 → W10) ────────────────────────────────

/** Id del elemento del dibujo bajo `objetivo` (los elementos se dibujan como `<g data-elemento-id>`). */
export function elementoBajo(objetivo: EventTarget | null): string | null {
  const nodo = objetivo as Element | null;
  return nodo?.closest?.("[data-elemento-id]")?.getAttribute("data-elemento-id") ?? null;
}
