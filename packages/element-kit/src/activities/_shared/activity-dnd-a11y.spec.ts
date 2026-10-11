/**
 * U6 — piezas puras de accesibilidad del arrastre: etiquetas, anuncios en español,
 * dirección de las flechas y salto entre zonas.
 */
import { describe, expect, it, vi } from "vitest";
import type { KeyboardCoordinateGetter } from "@dnd-kit/core";

import {
  INSTRUCCIONES_DND_ES,
  NOMBRE_GENERICO,
  coordenadasPorZonas,
  crearAnunciosDnd,
  direccionDeTecla,
  etiquetaDe,
  zonaEnDireccion,
  type RectLike,
} from "./activity-dnd-a11y.js";

const r = (left: number, top: number, width = 80, height = 80): RectLike => ({ left, top, width, height });
const ent = (id: string, etiqueta?: string) => ({ id, data: { current: etiqueta === undefined ? undefined : { etiqueta } } });

describe("etiquetaDe", () => {
  it("usa `data.etiqueta`, luego el resolvedor y por último el nombre genérico", () => {
    expect(etiquetaDe(ent("a", "  Casa  "), "el elemento")).toBe("Casa");
    expect(etiquetaDe(ent("a"), "el elemento", (id) => `Pieza ${String(id)}`)).toBe("Pieza a");
    expect(etiquetaDe(ent("a", "   "), "el elemento")).toBe("el elemento");
    expect(etiquetaDe(null, "una zona")).toBe("una zona");
    expect(etiquetaDe({ id: "a", data: { current: { etiqueta: 5 } } }, "x")).toBe("x");
  });
});

describe("crearAnunciosDnd", () => {
  const a = crearAnunciosDnd();
  const activo = ent("p1", "casa");
  const zona = ent("z1", "Zona de objetos");

  it("narra levantar, pasar por una zona, soltar y cancelar, en español", () => {
    expect(a.onDragStart({ active: activo as never })).toBe("Levantaste casa.");
    expect(a.onDragOver({ active: activo as never, over: zona as never })).toBe("Casa está sobre Zona de objetos.");
    expect(a.onDragOver({ active: activo as never, over: null })).toBe("Casa ya no está sobre ninguna zona.");
    expect(a.onDragEnd({ active: activo as never, over: zona as never })).toBe("Soltaste casa en Zona de objetos.");
    expect(a.onDragEnd({ active: activo as never, over: null })).toBe("Soltaste casa fuera de las zonas. Quedó donde estaba.");
    expect(a.onDragCancel({ active: activo as never, over: null })).toBe("Cancelaste el movimiento. Casa volvió a su lugar.");
  });

  it("sin etiquetas dice «el elemento» y «una zona»; el resolvedor las completa", () => {
    expect(a.onDragStart({ active: ent("x") as never })).toBe(`Levantaste ${NOMBRE_GENERICO.item}.`);
    expect(a.onDragEnd({ active: ent("x") as never, over: ent("y") as never })).toBe(`Soltaste el elemento en una zona.`);
    const b = crearAnunciosDnd({ item: (id) => `letra ${String(id)}`, zona: (id) => `casilla ${String(id)}` });
    expect(b.onDragEnd({ active: ent("A") as never, over: ent("3") as never })).toBe("Soltaste letra A en casilla 3.");
  });

  it("las instrucciones explican teclado, flechas y cancelar", () => {
    const t = INSTRUCCIONES_DND_ES.draggable;
    expect(t).toMatch(/Espacio o Enter/);
    expect(t).toMatch(/flechas/);
    expect(t).toMatch(/Escape/);
  });
});

describe("direccionDeTecla", () => {
  it("traduce las cuatro flechas y nada más", () => {
    expect(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "Tab", "KeyA"].map(direccionDeTecla)).toEqual([
      "arriba", "abajo", "izquierda", "derecha", null, null, null,
    ]);
  });
});

describe("zonaEnDireccion", () => {
  const desde = r(0, 100, 40, 40);
  const zonas = [
    { id: "A", rect: r(100, 0) },
    { id: "B", rect: r(200, 100) },
    { id: "C", rect: r(300, 100) },
    { id: "D", rect: r(0, 300) },
  ];

  it("elige la más cercana hacia ese lado y prefiere la alineada", () => {
    expect(zonaEnDireccion(desde, zonas, "derecha")?.id).toBe("B");
    expect(zonaEnDireccion(desde, zonas, "abajo")?.id).toBe("D");
  });
  it("sin zona hacia ese lado, `null`", () => {
    expect(zonaEnDireccion(desde, zonas, "izquierda")).toBeNull();
    expect(zonaEnDireccion(desde, [], "derecha")).toBeNull();
  });
  it("una zona con el mismo centro no cuenta (es donde ya está)", () => {
    expect(zonaEnDireccion(r(100, 100), [{ id: "yo", rect: r(100, 100) }], "derecha")).toBeNull();
  });
  it("de una a otra, encadenando flechas, recorre la fila", () => {
    let pos: RectLike = zonas[0].rect;
    const recorrido: string[] = [];
    for (let i = 0; i < 3; i++) {
      const sig = zonaEnDireccion(pos, zonas.filter((z) => z.rect !== pos), "derecha");
      if (!sig) break;
      recorrido.push(sig.id);
      pos = sig.rect;
    }
    expect(recorrido).toEqual(["B", "C"]);
  });
});

describe("coordenadasPorZonas", () => {
  /** Contexto mínimo de dnd-kit: solo lo que usa el getter. */
  function contexto(rects: Record<string, RectLike>, collision: RectLike, deshabilitadas: string[] = []) {
    const mapa = new Map(Object.entries(rects));
    return {
      collisionRect: collision,
      droppableRects: mapa,
      droppableContainers: {
        getEnabled: () =>
          [...mapa.keys()].filter((id) => !deshabilitadas.includes(id)).map((id) => ({ id, disabled: false })),
      },
    };
  }
  const llamar = (code: string, ctx: ReturnType<typeof contexto>, active = "item") => {
    const event = { code, preventDefault: vi.fn() } as unknown as KeyboardEvent;
    const res = (coordenadasPorZonas as KeyboardCoordinateGetter)(event, {
      active,
      currentCoordinates: { x: 10, y: 20 },
      context: ctx as never,
    });
    return { res, event };
  };

  it("salta al centro de la zona vecina: mueve las coordenadas por la diferencia de centros", () => {
    const ctx = contexto({ A: r(100, 0, 80, 80) }, r(0, 0, 40, 40));
    const { res, event } = llamar("ArrowRight", ctx);
    // centro actual (20,20); centro de A (140,40) → delta (120, 20)
    expect(res).toEqual({ x: 130, y: 40 });
    expect((event.preventDefault as ReturnType<typeof vi.fn>)).toHaveBeenCalled();
  });
  it("no se mueve si no hay zona en esa dirección, y ignora zonas deshabilitadas", () => {
    const ctx = contexto({ A: r(100, 0) }, r(0, 0, 40, 40), ["A"]);
    expect(llamar("ArrowRight", ctx).res).toBeUndefined();
    expect(llamar("ArrowLeft", contexto({ A: r(100, 0) }, r(0, 0, 40, 40))).res).toBeUndefined();
  });
  it("las teclas que no son flechas no se tocan (ni se les hace preventDefault)", () => {
    const { res, event } = llamar("Space", contexto({ A: r(100, 0) }, r(0, 0, 40, 40)));
    expect(res).toBeUndefined();
    expect((event.preventDefault as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });
  it("el propio elemento activo no es destino", () => {
    const ctx = contexto({ item: r(100, 0) }, r(0, 0, 40, 40));
    expect(llamar("ArrowRight", ctx, "item").res).toBeUndefined();
  });
});
