/**
 * E7.1 fijó `ElementDefinition.catalogo` como fuente de la metadata de catálogo.
 * La paridad contra los registros legacy (`WIDGET_LABELS`, `ACTIVITY_REGISTRY`)
 * se verificó mientras ambos vivían (E7.1, run verde `3fbd981`). E7.2 borró
 * `widget-registry.ts`, E7.3 borró `activity-registry.ts`; acá queda el chequeo
 * intrínseco: cada elemento registrado tiene catálogo bien formado y no hay
 * entradas de más.
 */
import { describe, expect, it } from "vitest";
import { WIDGET_TIPOS } from "../../../../../lumina-frontend/src/types/widget.types.js";
import { CATALOGO_ELEMENTOS } from "./catalogo.js";
import { elementRegistry } from "../../index.js";

const GRUPO4_TIPOS = [
  "clasificar",
  "memoria",
  "puzzle_imagen",
  "sopa_letras",
  "crucigrama",
  "abrir_caja",
  "anagrama",
  "ahorcado",
  "puzzle_palabras",
  "globos",
  "topo",
  "historia_ramificada",
] as const;

describe("ElementDefinition.catalogo (E7.1)", () => {
  it("cada elemento registrado tiene catálogo bien formado", () => {
    for (const def of elementRegistry.listar()) {
      const tipo = (def as { tipo: string }).tipo;
      const cat = (def as { catalogo?: { nombre?: string; familia?: string } })
        .catalogo;
      expect(cat, `${tipo} sin catálogo`).toBeDefined();
      expect((cat?.nombre ?? "").length, `${tipo} sin nombre`).toBeGreaterThan(0);
      expect(
        ["widget", "actividad", "bloque", "primitivo"],
        `${tipo} familia inválida`,
      ).toContain(cat?.familia);
    }
  });

  it("widgets: familia 'widget' y grupo lienzo/overlay/control", () => {
    for (const tipo of WIDGET_TIPOS) {
      const cat = CATALOGO_ELEMENTOS[tipo as keyof typeof CATALOGO_ELEMENTOS];
      expect(cat, `${tipo} ausente en el catálogo`).toBeDefined();
      expect(cat.familia).toBe("widget");
      expect(["lienzo", "overlay", "control"]).toContain(
        (cat as { grupo?: string }).grupo,
      );
    }
  });

  it("actividades Grupo 4: familia 'actividad', nombre y descripción presentes", () => {
    for (const tipo of GRUPO4_TIPOS) {
      const cat = CATALOGO_ELEMENTOS[tipo];
      expect(cat, `${tipo} ausente en el catálogo`).toBeDefined();
      expect(cat.familia).toBe("actividad");
      expect(cat.nombre.length).toBeGreaterThan(0);
      expect((cat as { descripcion?: string }).descripcion?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("el catálogo no tiene entradas de más (todas están registradas)", () => {
    const registrados = new Set(
      elementRegistry.listar().map((d) => (d as { tipo: string }).tipo),
    );
    for (const tipo of Object.keys(CATALOGO_ELEMENTOS)) {
      expect(
        registrados.has(tipo),
        `${tipo} en catálogo pero sin registrar`,
      ).toBe(true);
    }
  });
});
