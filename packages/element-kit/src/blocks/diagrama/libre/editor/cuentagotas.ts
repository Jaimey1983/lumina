// ─── Cuentagotas (Y22) ────────────────────────────────────────────────────────
// Envuelve la API `EyeDropper` del navegador (solo Chromium, solo en contexto seguro, exige un gesto del usuario).
// TypeScript no la tipa: se declara aquí la interfaz mínima. Nada de esto toca el modelo (DY14).

interface EyeDropperLike {
  open(): Promise<{ sRGBHex: string }>;
}
type ConstructorEyeDropper = new () => EyeDropperLike;

function api(): ConstructorEyeDropper | undefined {
  const g = globalThis as { EyeDropper?: unknown };
  return typeof g.EyeDropper === "function" ? (g.EyeDropper as ConstructorEyeDropper) : undefined;
}

/** `true` si el navegador tiene el cuentagotas y la página es un contexto seguro. Si no, el botón no se muestra (DY28). */
export function cuentagotasDisponible(): boolean {
  return api() !== undefined && (globalThis as { isSecureContext?: boolean }).isSecureContext !== false;
}

let abiertos = 0;

/** `true` mientras hay un cuentagotas abierto: el selector de color no debe cerrarse por la pérdida de foco que provoca. */
export function cuentagotasAbierto(): boolean {
  return abiertos > 0;
}

/** Abre el cuentagotas y devuelve el color como `#RRGGBB` en mayúsculas; `null` si se cancela o falla (nunca lanza). */
export async function pedirColor(): Promise<string | null> {
  const Cuentagotas = api();
  if (!Cuentagotas) return null;
  abiertos += 1;
  try {
    const { sRGBHex } = await new Cuentagotas().open();
    return typeof sRGBHex === "string" && /^#[0-9a-f]{6}$/i.test(sRGBHex) ? sRGBHex.toUpperCase() : null;
  } catch {
    return null;
  } finally {
    abiertos -= 1;
  }
}
