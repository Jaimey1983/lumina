// ─── Preferencias del texto (Y24b) ────────────────────────────────────────────
// «Crecer al escribir» es una preferencia del navegador (DY15, DY42): no es del dibujo, no se guarda en la escena ni se exporta. Lee y
// escribe `localStorage` con `try/catch` (sin almacenamiento el editor funciona igual, solo no recuerda).

export const CLAVE_CRECER_AL_ESCRIBIR = "lumina.dibujo.crecer-al-escribir";

/** Apagada por defecto: ninguna forma cambia de tamaño si la persona no lo pidió. */
export function leerCrecerAlEscribir(): boolean {
  try {
    return globalThis.localStorage.getItem(CLAVE_CRECER_AL_ESCRIBIR) === "1";
  } catch {
    return false;
  }
}

export function guardarCrecerAlEscribir(activa: boolean): void {
  try {
    globalThis.localStorage.setItem(CLAVE_CRECER_AL_ESCRIBIR, activa ? "1" : "0");
  } catch {
    /* sin almacenamiento o cuota llena: el editor funciona igual, solo no recuerda */
  }
}
