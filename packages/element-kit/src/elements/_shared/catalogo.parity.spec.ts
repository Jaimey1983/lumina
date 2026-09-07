/**
 * E7.1 — paridad del `catalogo` de cada `ElementDefinition` contra los
 * registros legacy del frontend (`WIDGET_LABELS`, `ACTIVITY_REGISTRY`), que
 * E7.2/E7.3 van a borrar. Regla 7: probar la equivalencia antes del borrado.
 */
import { describe, expect, it } from "vitest";
import {
  WIDGET_LABELS,
  WIDGET_TIPOS,
} from "../../../../../lumina-frontend/src/components/widgets/shared/widget-registry.js";
import { ACTIVITY_REGISTRY } from "../../../../../lumina-frontend/src/components/activities/shared/activity-registry.js";
import { CATALOGO_ELEMENTOS } from "./catalogo.js";
import { elementRegistry } from "../../index.js";

describe("E7.1 — ElementDefinition.catalogo vs registros legacy", () => {
  it("cada elemento registrado tiene catálogo", () => {
    for (const def of elementRegistry.listar()) {
      const tipo = (def as { tipo: string }).tipo;
      expect(
        (def as { catalogo?: unknown }).catalogo,
        `${tipo} sin catálogo`,
      ).toBeDefined();
    }
  });

  it("widgets: nombre == WIDGET_LABELS y familia 'widget'", () => {
    for (const tipo of WIDGET_TIPOS) {
      const cat = CATALOGO_ELEMENTOS[tipo as keyof typeof CATALOGO_ELEMENTOS];
      expect(cat, `${tipo} ausente en el catálogo`).toBeDefined();
      expect(cat.nombre).toBe(WIDGET_LABELS[tipo]);
      expect(cat.familia).toBe("widget");
      expect(["lienzo", "overlay", "control"]).toContain(
        (cat as { grupo?: string }).grupo,
      );
    }
  });

  it("actividades Grupo 4: nombre + descripción == ACTIVITY_REGISTRY", () => {
    for (const entry of ACTIVITY_REGISTRY) {
      const cat =
        CATALOGO_ELEMENTOS[entry.tipo as keyof typeof CATALOGO_ELEMENTOS];
      expect(cat, `${entry.tipo} ausente en el catálogo`).toBeDefined();
      expect(cat.nombre).toBe(entry.nombre);
      expect((cat as { descripcion?: string }).descripcion).toBe(
        entry.descripcion,
      );
      expect(cat.familia).toBe("actividad");
    }
  });

  it("el catálogo no tiene entradas de más (todas están registradas)", () => {
    const registrados = new Set(
      elementRegistry.listar().map((d) => (d as { tipo: string }).tipo),
    );
    for (const tipo of Object.keys(CATALOGO_ELEMENTOS)) {
      expect(registrados.has(tipo), `${tipo} en catálogo pero sin registrar`).toBe(
        true,
      );
    }
  });
});
