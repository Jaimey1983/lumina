/**
 * Contrato de los widgets (T): cada `WidgetTipo` está registrado una sola vez como
 * `ElementDefinition` completa, y los que nacen solo en el registry (T16–T20) arrancan con el
 * marco de `BLOCK_FALLBACKS`.
 */
import { describe, expect, it } from "vitest";
import { elementRegistry } from "@lumina/element-kit-core";
import { BLOCK_FALLBACKS } from "@lumina/types/slide";
import { WIDGET_TIPOS, WIDGET_TIPOS_SOLO_REGISTRY } from "@lumina/types/widget";
import "../index.js";

/** Widgets que no declaran `presets` (la molécula y la tabla periódica no tienen estilos). */
const SIN_PRESETS = new Set(["molecula", "tabla_periodica"]);

/** `WidgetTipo` → clave de `BLOCK_FALLBACKS` (camelCase). */
const clave = (tipo: string) => tipo.replace(/[-_](\w)/g, (_, c: string) => c.toUpperCase());

describe("contrato de widgets", () => {
  for (const tipo of WIDGET_TIPOS) {
    it(`${tipo}: ElementDefinition completa y registrada`, () => {
      const def = elementRegistry.obtener(tipo);
      expect(def, `${tipo} no está en el registry`).toBeDefined();
      expect(def?.tipo).toBe(tipo);
      expect(def?.Editor).toBeTruthy();
      expect(def?.Viewer).toBeTruthy();
      expect(def?.Propiedades).toBeTruthy();
      expect(def?.apariencia).toBeDefined();
      expect(typeof def?.crearPorDefecto).toBe("function");
      if (!SIN_PRESETS.has(tipo)) expect(def?.presets?.length ?? 0).toBeGreaterThan(0);
    });
  }

  for (const tipo of WIDGET_TIPOS_SOLO_REGISTRY) {
    it(`${tipo}: crearPorDefecto usa BLOCK_FALLBACKS`, () => {
      const fb = BLOCK_FALLBACKS[clave(tipo) as keyof typeof BLOCK_FALLBACKS] as {
        x: number;
        y: number;
        ancho: number;
        alto: number;
      };
      const bloque = elementRegistry.obtener(tipo)?.crearPorDefecto() as { tipo: string } & typeof fb;
      expect(bloque.tipo).toBe(tipo);
      expect({ x: bloque.x, y: bloque.y, ancho: bloque.ancho, alto: bloque.alto }).toEqual(fb);
    });
  }
});
