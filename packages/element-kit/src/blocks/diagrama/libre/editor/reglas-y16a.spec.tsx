import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Escena, Forma } from "@lumina/drawing";
import { EditorLibre } from "./editor-libre.js";
import { COMANDOS, comando, estadoComando } from "./comandos-registro.js";
import { botonCinta, escena, forma } from "./util-pruebas.js";

afterEach(cleanup);

// La página mide 1000 × 600; las guías se ponen lejos de sus bordes y de su centro para que solo cuenten ellas.
const base = (): Escena => escena(forma("a", 100, 100, 100, 100), forma("b", 600, 400, 100, 100));
const getForma = (e: Escena, id: string): Forma => e.elementos.find((x) => x.id === id) as Forma;

function montar(e: Escena = base()) {
  const onCambio = vi.fn<(s: Escena) => void>();
  const onCerrar = vi.fn();
  render(<EditorLibre escena={e} onCambio={onCambio} onCerrar={onCerrar} />);
  const lienzo = screen.getByRole("application", { name: "Lienzo de dibujo" }) as unknown as SVGSVGElement;
  // jsdom no tiene diseño: el lienzo ocupa 1000 × 600 desde (0, 0).
  vi.spyOn(lienzo, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, right: 1000, bottom: 600, width: 1000, height: 600, x: 0, y: 0, toJSON: () => ({}) });
  fireEvent.click(botonCinta("Imantar a otros elementos")); // sin el imán a otros elementos: solo cuentan las guías de la persona
  const vista = () => {
    const g = document.querySelector("[data-dibujo-pagina]")?.parentElement?.getAttribute("transform") ?? "";
    const m = /translate\(([-\d.e]+) ([-\d.e]+)\) scale\(([-\d.e]+)\)/.exec(g);
    return { x: Number(m?.[1]), y: Number(m?.[2]), z: Number(m?.[3]) };
  };
  /** Pantalla de un punto de la escena. */
  const pant = (x: number, y: number): [number, number] => {
    const v = vista();
    return [v.x + x * v.z, v.y + y * v.z];
  };
  const evento = (tipo: string, x: number, y: number, extra: Record<string, unknown> = {}): void => {
    const [cx, cy] = pant(x, y);
    fireEvent(lienzo, new MouseEvent(tipo, { bubbles: true, cancelable: true, button: 0, clientX: cx, clientY: cy, ...extra }));
  };
  const enVentana = (tipo: string, cx: number, cy: number): void => {
    fireEvent(window, new MouseEvent(tipo, { bubbles: true, cancelable: true, button: 0, clientX: cx, clientY: cy }));
  };
  return {
    lienzo,
    onCambio,
    onCerrar,
    pant,
    anuncio: () => document.querySelector("[data-dibujo-anuncio]")?.textContent ?? "",
    guias: () => [...document.querySelectorAll("[data-capa=guias-usuario] [data-guia]")].filter((l) => l.getAttribute("data-guia") !== "previa"),
    previa: () => document.querySelector("[data-capa=guias-usuario] [data-guia=previa]"),
    /** Arrastra desde una regla hasta un punto de la escena y suelta. `eje`: la regla de arriba (x) o la de la izquierda (y). */
    nuevaGuia: (eje: "x" | "y", x: number, y: number, soltar = true) => {
      const regla = document.querySelector(`[data-regla=${eje}]`) as SVGElement;
      fireEvent(regla, new MouseEvent("pointerdown", { bubbles: true, cancelable: true, button: 0, clientX: 5, clientY: 5 }));
      const [cx, cy] = pant(x, y);
      enVentana("pointermove", cx, cy);
      if (soltar) enVentana("pointerup", cx, cy);
    },
    marcador: (n = 0) => document.querySelectorAll("[data-guia-marca]")[n] as SVGElement,
    mover: (cx: number, cy: number) => enVentana("pointermove", cx, cy),
    soltar: (cx: number, cy: number) => enVentana("pointerup", cx, cy),
    arrastrarForma: (desde: [number, number], hasta: [number, number], extra: Record<string, unknown> = {}) => {
      evento("pointerdown", ...desde, extra);
      evento("pointermove", (desde[0] + hasta[0]) / 2, (desde[1] + hasta[1]) / 2, extra);
      evento("pointermove", ...hasta, extra);
      evento("pointerup", ...hasta, extra);
    },
    clic: (x: number, y: number) => {
      evento("pointerdown", x, y);
      evento("pointerup", x, y);
    },
    doble: (x: number, y: number) => {
      const [cx, cy] = pant(x, y);
      fireEvent(lienzo, new MouseEvent("dblclick", { bubbles: true, cancelable: true, clientX: cx, clientY: cy }));
    },
  };
}

const activarReglas = (): void => {
  fireEvent.click(botonCinta("Reglas"));
};

describe("Y16a — los comandos", () => {
  it("«Reglas» y «Quitar guías» están en el registro, en Vista, sin atajo", () => {
    expect(comando("reglas").orden).toEqual({ tipo: "reglas" });
    expect(comando("quitar-guias").orden).toEqual({ tipo: "quitar-guias" });
    for (const id of ["reglas", "quitar-guias"]) {
      expect(comando(id).grupo).toBe("vista");
      expect(comando(id).atajos).toBeUndefined();
      expect(COMANDOS.filter((c) => c.id === id)).toHaveLength(1);
    }
  });
  it("estados: Reglas activo según el contexto; Quitar guías solo con guías", () => {
    const ctx = (extra: object) => ({ escena: escena(), seleccion: [], herramienta: { tipo: "seleccionar" as const }, puedeDeshacer: false, puedeRehacer: false, zoom: 1, cuadricula: false, imantar: false, ...extra });
    expect(estadoComando(comando("reglas"), ctx({ reglas: true })).activo).toBe(true);
    expect(estadoComando(comando("reglas"), ctx({})).activo).toBe(false);
    expect(estadoComando(comando("quitar-guias"), ctx({ guias: 0 })).habilitado).toBe(false);
    expect(estadoComando(comando("quitar-guias"), ctx({ guias: 2 })).habilitado).toBe(true);
  });
});

describe("Y16a — las reglas", () => {
  it("el botón alterna las reglas (con números en unidades de escena) y lo anuncia", () => {
    const m = montar();
    expect(document.querySelector("[data-regla]")).toBeNull();
    activarReglas();
    expect(document.querySelectorAll("[data-regla]")).toHaveLength(2);
    expect(m.anuncio()).toBe("Reglas activadas.");
    const numeros = [...document.querySelectorAll("[data-regla=x] [data-marca]")].map((t) => t.textContent);
    expect(numeros.length).toBeGreaterThan(2);
    expect(numeros).toContain("0");
    expect(botonCinta("Reglas").getAttribute("aria-pressed")).toBe("true");
    activarReglas();
    expect(document.querySelector("[data-regla]")).toBeNull();
    expect(m.anuncio()).toBe("Reglas ocultas.");
  });

  it("no tapan el lienzo: son hermanas del lienzo (nunca ancestras ni descendientes) y el hit-test no cambia", () => {
    const m = montar();
    const antes = () => {
      m.clic(150, 150);
      return document.body.textContent?.match(/(\d+) seleccionados?/)?.[1];
    };
    expect(antes()).toBe("1");
    activarReglas();
    for (const r of document.querySelectorAll("[data-regla]")) {
      expect(m.lienzo.contains(r)).toBe(false);
      expect(r.contains(m.lienzo)).toBe(false);
    }
    // Un clic en el mismo sitio elige lo mismo; y en el vacío no elige nada.
    m.clic(400, 300);
    expect(document.body.textContent).not.toMatch(/\d+ seleccionados?/);
    expect(antes()).toBe("1");
  });

  it("las marcas siguen al zoom: al acercar, los números cambian de paso", () => {
    const m = montar();
    activarReglas();
    const pasos = () => {
      const n = [...document.querySelectorAll("[data-regla=x] [data-marca]")].map((t) => Number((t.textContent ?? "").replace(",", "."))).filter((v) => v > 0);
      return n[1]! - n[0]!;
    };
    const antes = pasos();
    for (let i = 0; i < 4; i++) fireEvent.click(botonCinta("Acercar"));
    expect(pasos()).toBeLessThan(antes);
    expect(m.onCambio).not.toHaveBeenCalled();
  });
});

describe("Y16a — las guías", () => {
  it("arrastrar desde la regla de arriba crea una guía vertical; desde la de la izquierda, una horizontal", () => {
    const m = montar();
    activarReglas();
    m.nuevaGuia("x", 303, 250);
    expect(m.guias()).toHaveLength(1);
    expect(m.anuncio()).toBe("Guía vertical en 303.");
    m.nuevaGuia("y", 450, 153);
    expect(m.guias()).toHaveLength(2);
    expect(m.anuncio()).toBe("Guía horizontal en 153.");
    expect(m.guias().map((l) => l.tagName)).toEqual(["line", "line"]);
    // Cada una tiene su marcador en su regla.
    expect(document.querySelectorAll("[data-regla=x] [data-guia-marca]")).toHaveLength(1);
    expect(document.querySelectorAll("[data-regla=y] [data-guia-marca]")).toHaveLength(1);
  });

  it("mientras se arrastra se ve la guía nueva; si se suelta fuera del lienzo no se crea nada", () => {
    const m = montar();
    activarReglas();
    m.nuevaGuia("x", 303, 250, false);
    expect(m.previa()).not.toBeNull();
    m.mover(-40, 10); // de vuelta sobre la regla (fuera del lienzo)
    expect(m.previa()).toBeNull();
    m.soltar(-40, 10);
    expect(m.guias()).toHaveLength(0);
  });

  it("se mueven arrastrando su marcador", () => {
    const m = montar();
    activarReglas();
    m.nuevaGuia("x", 303, 250);
    const [antesX] = m.pant(303, 0);
    expect(Number(m.guias()[0]?.getAttribute("x1"))).toBeCloseTo(antesX, 3);
    const [nuevoX] = m.pant(403, 0);
    fireEvent(m.marcador(), new MouseEvent("pointerdown", { bubbles: true, cancelable: true, button: 0, clientX: antesX, clientY: 10 }));
    m.mover(nuevoX, 200);
    m.soltar(nuevoX, 200);
    expect(m.guias()).toHaveLength(1);
    expect(Number(m.guias()[0]?.getAttribute("x1"))).toBeCloseTo(nuevoX, 3);
  });

  it("se mueven arrastrándolas en el lienzo (en un vacío)", () => {
    const m = montar();
    activarReglas();
    m.nuevaGuia("x", 303, 250);
    const [x0, y0] = m.pant(303, 450);
    fireEvent(m.lienzo, new MouseEvent("pointerdown", { bubbles: true, cancelable: true, button: 0, clientX: x0, clientY: y0 }));
    const [x1] = m.pant(353, 450);
    m.mover(x1, y0);
    m.soltar(x1, y0);
    expect(Number(m.guias()[0]?.getAttribute("x1"))).toBeCloseTo(x1, 3);
  });

  it("los elementos mandan: una guía que pasa por una forma no la roba al hacer clic", () => {
    const m = montar();
    activarReglas();
    m.nuevaGuia("x", 150, 250); // atraviesa la forma «a» (x de 100 a 200)
    m.clic(150, 150);
    expect(document.body.textContent).toMatch(/1 seleccionado/);
    expect(m.guias()[0]?.getAttribute("x1")).toBe(String(m.pant(150, 0)[0]));
  });

  it("se quitan llevándolas de vuelta a la regla", () => {
    const m = montar();
    activarReglas();
    m.nuevaGuia("x", 303, 250);
    const [x0] = m.pant(303, 0);
    fireEvent(m.marcador(), new MouseEvent("pointerdown", { bubbles: true, cancelable: true, button: 0, clientX: x0, clientY: 10 }));
    m.mover(-30, 100); // a la izquierda del lienzo: hacia la regla de la izquierda… para una vertical cuenta ir a la izquierda
    expect(m.guias()[0]?.getAttribute("opacity")).toBe("0.3"); // atenuada: se va a quitar
    m.soltar(-30, 100);
    expect(m.guias()).toHaveLength(0);
    expect(m.anuncio()).toBe("Guía quitada.");
  });

  it("una horizontal se quita llevándola hacia arriba, a su regla", () => {
    const m = montar();
    activarReglas();
    m.nuevaGuia("y", 450, 153);
    const [, y0] = m.pant(0, 153);
    fireEvent(m.marcador(), new MouseEvent("pointerdown", { bubbles: true, cancelable: true, button: 0, clientX: 10, clientY: y0 }));
    m.mover(100, -20);
    m.soltar(100, -20);
    expect(m.guias()).toHaveLength(0);
  });

  it("se quitan con doble clic en su marcador o sobre la guía en un vacío", () => {
    const m = montar();
    activarReglas();
    m.nuevaGuia("x", 303, 250);
    m.nuevaGuia("y", 450, 153);
    fireEvent.doubleClick(m.marcador());
    expect(m.guias()).toHaveLength(1);
    m.doble(450, 153); // sobre la horizontal que queda, en un vacío
    expect(m.guias()).toHaveLength(0);
  });

  it("«Quitar guías» las borra todas y se deshabilita", () => {
    const m = montar();
    activarReglas();
    expect(botonCinta("Quitar guías").getAttribute("aria-disabled")).toBe("true");
    m.nuevaGuia("x", 303, 250);
    m.nuevaGuia("y", 450, 153);
    expect(botonCinta("Quitar guías").getAttribute("aria-disabled")).not.toBe("true");
    fireEvent.click(botonCinta("Quitar guías"));
    expect(m.guias()).toHaveLength(0);
    expect(m.anuncio()).toBe("Guías quitadas.");
    expect(botonCinta("Quitar guías").getAttribute("aria-disabled")).toBe("true");
  });

  it("tope de 50: la 50 entra y la 51 avisa", () => {
    const m = montar();
    activarReglas();
    for (let i = 0; i < 50; i++) m.nuevaGuia("x", 300 + i * 7, 250);
    expect(m.guias()).toHaveLength(50);
    m.nuevaGuia("x", 700, 250);
    expect(m.guias()).toHaveLength(50);
    expect(m.anuncio()).toBe("Ya hay 50 guías: quita alguna para poner otra.");
  });

  it("Escape cancela el arrastre: una nueva no se crea, una existente vuelve a su sitio, y el editor no se cierra", () => {
    const m = montar();
    activarReglas();
    m.nuevaGuia("x", 303, 250, false);
    fireEvent.keyDown(window, { key: "Escape" });
    m.soltar(...m.pant(303, 250));
    expect(m.guias()).toHaveLength(0);
    m.nuevaGuia("x", 303, 250);
    const [x0] = m.pant(303, 0);
    fireEvent(m.marcador(), new MouseEvent("pointerdown", { bubbles: true, cancelable: true, button: 0, clientX: x0, clientY: 10 }));
    m.mover(...m.pant(403, 250));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(Number(m.guias()[0]?.getAttribute("x1"))).toBeCloseTo(x0, 3);
    expect(m.onCerrar).not.toHaveBeenCalled();
  });

  it("ocultar las reglas oculta las guías (y dejan de imantar); al volver a mostrarlas siguen ahí", () => {
    const m = montar();
    activarReglas();
    m.nuevaGuia("x", 303, 250);
    activarReglas();
    expect(m.guias()).toHaveLength(0);
    activarReglas();
    expect(m.guias()).toHaveLength(1);
  });
});

describe("Y16a — el imán a las guías", () => {
  // «a» ocupa x de 100 a 200 y y de 100 a 200; se arrastra desde su centro (150, 150).
  it("la forma se imanta a una guía vertical aunque el imán a otros elementos esté apagado", () => {
    const m = montar();
    activarReglas();
    m.nuevaGuia("x", 303, 450); // el borde derecho de «a» (200) llegaría a 303 con +103
    m.arrastrarForma([150, 150], [150 + 100, 150]); // sin guía quedaría con el borde derecho en 300
    const a = getForma(base(), "a");
    expect(a.transformacion.x).toBe(100);
    // Con el movimiento de arriba (+100) la forma queda con x = 200: su borde derecho está en 300, a 3 de la guía → se pega.
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    expect(getForma(m.onCambio.mock.calls[0]![0], "a").transformacion.x).toBeCloseTo(203, 3);
  });

  it("también a una horizontal, y a las dos a la vez", () => {
    const m = montar();
    activarReglas();
    m.nuevaGuia("x", 303, 450);
    m.nuevaGuia("y", 450, 253);
    m.arrastrarForma([150, 150], [250, 250]); // sin guías: x=200, y=200 → los bordes derecho y de abajo en 300
    const t = getForma(m.onCambio.mock.calls[0]![0], "a").transformacion;
    expect(t.x).toBeCloseTo(203, 3);
    expect(t.y).toBeCloseTo(203, 3);
  });

  it("Ctrl suspende el imán de las guías", () => {
    const m = montar();
    activarReglas();
    m.nuevaGuia("x", 303, 450);
    m.arrastrarForma([150, 150], [250, 150], { ctrlKey: true });
    expect(getForma(m.onCambio.mock.calls[0]![0], "a").transformacion.x).toBeCloseTo(200, 3);
  });

  it("con las reglas ocultas no imantan", () => {
    const m = montar();
    activarReglas();
    m.nuevaGuia("x", 303, 450);
    activarReglas();
    m.arrastrarForma([150, 150], [250, 150]);
    expect(getForma(m.onCambio.mock.calls[0]![0], "a").transformacion.x).toBeCloseTo(200, 3);
  });

  it("el extremo de una línea que se dibuja también se imanta a las guías", () => {
    const m = montar();
    activarReglas();
    m.nuevaGuia("x", 303, 450);
    fireEvent.click(botonCinta("Línea"));
    m.arrastrarForma([420, 450], [306, 450]);
    const linea = m.onCambio.mock.calls[0]![0].elementos.find((x) => x.tipo === "linea");
    expect(linea?.tipo === "linea" ? linea.puntos[1]?.x : null).toBeCloseTo(303, 3);
  });

  it("lejos de la guía (más allá del umbral) no imanta", () => {
    const m = montar();
    activarReglas();
    m.nuevaGuia("x", 320, 450);
    m.arrastrarForma([150, 150], [250, 150]);
    expect(getForma(m.onCambio.mock.calls[0]![0], "a").transformacion.x).toBeCloseTo(200, 3);
  });
});

describe("Y16a — DY9: las guías no son de la escena", () => {
  it("crear, mover y quitar guías no llama a onCambio ni toca el historial", () => {
    const m = montar();
    activarReglas();
    m.nuevaGuia("x", 303, 250);
    m.nuevaGuia("y", 450, 153);
    fireEvent.click(botonCinta("Quitar guías"));
    expect(m.onCambio).not.toHaveBeenCalled();
    expect(botonCinta("Deshacer").getAttribute("aria-disabled")).toBe("true");
  });

  it("deshacer no quita las guías y la escena que sale del editor no las lleva", () => {
    const m = montar();
    activarReglas();
    m.nuevaGuia("x", 303, 450);
    m.arrastrarForma([150, 150], [250, 150]);
    const salida = m.onCambio.mock.calls[0]![0];
    expect(JSON.stringify(salida)).not.toMatch(/guia/i);
    fireEvent.click(botonCinta("Deshacer"));
    expect(m.guias()).toHaveLength(1);
  });
});
