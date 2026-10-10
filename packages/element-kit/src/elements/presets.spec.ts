/**
 * T2b — guarda de presets: ningún preset declarado puede ser un parche vacío
 * (un botón de la galería que no cambia nada). Que las claves existan en el
 * estado lo garantiza el tipo `ElementPreset<TEstado>` (T2), no este spec.
 */
import { describe, expect, it } from "vitest";
import { elementRegistry, type ElementDefinition } from "@lumina/element-kit-core";
import "../index.js";

function hojas(valor: unknown, ruta = ""): string[] {
  if (typeof valor !== "object" || valor === null || Array.isArray(valor)) return [ruta];
  return Object.entries(valor).flatMap(([clave, v]) =>
    hojas(v, ruta ? `${ruta}.${clave}` : clave),
  );
}

const conPresets = (elementRegistry.listar() as readonly ElementDefinition<unknown, unknown>[]).filter((def) => (def.presets?.length ?? 0) > 0);

describe("presets declarados", () => {
  it("hay elementos con presets registrados", () => {
    expect(conPresets.length).toBeGreaterThanOrEqual(15);
  });

  for (const def of conPresets) {
    describe(def.tipo, () => {
      for (const preset of def.presets ?? []) {
        it(`${preset.id}: el parche cambia algo`, () => {
          expect(hojas(preset.estadoPatch).filter(Boolean).length, "parche vacío").toBeGreaterThan(0);
        });
      }
    });
  }
});
