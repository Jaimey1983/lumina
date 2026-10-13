/**
 * X.4 — guarda de `@source` de Tailwind.
 *
 * Tailwind v4 solo escanea `lumina-frontend/` y los `@source` declarados en
 * `globals.css`; NO entra a `node_modules`, y los paquetes del workspace llegan
 * por ahí. Un paquete con `className="…"` sin `@source` pierde en producción las
 * clases que ningún otro archivo repite (en X.4 se midieron 256 perdidas, p. ej.
 * `text-green-500`, `border-green-400`). Este spec falla antes de que pase.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const aquí = dirname(fileURLToPath(import.meta.url));
const GLOBALS = resolve(aquí, '../styles/globals.css');
const PAQUETES = resolve(aquí, '../../../packages');

/**
 * Paquetes con `className=` que NO emiten utilidades propias, con el motivo.
 * Agregar uno acá exige justificarlo; lo normal es declarar su `@source`.
 */
const SIN_UTILIDADES: Record<string, string> = {
  'canvas-align': 'solo reenvía la prop `className` que recibe; no escribe utilidades',
};

/** Directorios `@source` declarados en `globals.css`, resueltos desde el propio archivo. */
export function fuentesDeclaradas(css: string, base: string): string[] {
  const hallados: string[] = [];
  for (const m of css.matchAll(/^@source\s+["']([^"']+)["']\s*;/gm)) {
    hallados.push(resolve(base, m[1]));
  }
  return hallados;
}

function archivosTsx(dir: string): string[] {
  const salida: string[] = [];
  for (const nombre of readdirSync(dir)) {
    if (nombre === 'node_modules' || nombre === 'dist') continue;
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) salida.push(...archivosTsx(ruta));
    else if (nombre.endsWith('.tsx') && !/\.(spec|test)\./.test(nombre)) salida.push(ruta);
  }
  return salida;
}

function usaClassName(paquete: string): boolean {
  const src = join(PAQUETES, paquete, 'src');
  if (!existsSync(src)) return false;
  return archivosTsx(src).some((f) => /className=/.test(readFileSync(f, 'utf-8')));
}

describe('@source de Tailwind en globals.css (X.4)', () => {
  const declaradas = fuentesDeclaradas(readFileSync(GLOBALS, 'utf-8'), dirname(GLOBALS));
  const paquetes = readdirSync(PAQUETES).filter((p) => statSync(join(PAQUETES, p)).isDirectory());

  it('declara al menos los paquetes que ya se sabía que emiten clases', () => {
    for (const p of ['ui', 'editor-shared', 'element-kit']) {
      expect(declaradas, p).toContain(join(PAQUETES, p, 'src'));
    }
  });

  for (const paquete of paquetes) {
    if (!usaClassName(paquete)) continue;
    if (paquete in SIN_UTILIDADES) {
      it(`${paquete}: exento (${SIN_UTILIDADES[paquete]})`, () => {
        expect(SIN_UTILIDADES[paquete].length).toBeGreaterThan(0);
      });
      continue;
    }
    it(`${paquete}: tiene className="…" y su @source está declarado`, () => {
      expect(
        declaradas,
        `packages/${paquete}/src usa className pero globals.css no declara @source "../../../packages/${paquete}/src"`,
      ).toContain(join(PAQUETES, paquete, 'src'));
    });
  }

  it('cada @source declarado apunta a un directorio que existe', () => {
    for (const d of declaradas) expect(existsSync(d), d).toBe(true);
  });
});
