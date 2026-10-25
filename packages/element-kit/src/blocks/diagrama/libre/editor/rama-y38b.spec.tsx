import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { conectarFormas, fijarColapso, type Escena } from "@lumina/drawing";
import { buscarComandos } from "./buscar-comandos.js";
import { COMANDOS, comando, comandoDeTecla, estadoComando, menuDe, type ContextoComando, type ElementoDeMenu } from "./comandos-registro.js";
import { desplegarTodo, elegibles, plegarElegidas } from "./comandos.js";
import { EditorLibre } from "./editor-libre.js";
import { capasDe } from "./propiedades.js";
import { PanelPropiedades } from "./propiedades-panel.js";
import { descendientesDe, ramasElegidas } from "./rama-panel.js";
import { elementosAccesibles } from "../accesibilidad.js";
import { botonCinta, escena, forma, getForma, grupo, linea } from "./util-pruebas.js";

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  localStorage.clear();
});

/** raiz → a, b; a → a1, a2; b → b1. Plegar `a` oculta a1 y a2. */
const arbol = (): Escena => {
  let e = escena(...["raiz", "a", "b", "a1", "a2", "b1"].map((id, i) => forma(id, 20 + i * 150, 40 + (i % 3) * 100, 100, 60, { texto: id })));
  for (const [p, h] of [["raiz", "a"], ["raiz", "b"], ["a", "a1"], ["a", "a2"], ["b", "b1"]] as const) e = conectarFormas(e, p, h);
  return e;
};
const plegada = (e: Escena, ...ids: string[]): Escena => fijarColapso(e, ids, true);
const colapsado = (e: Escena, id: string): boolean => getForma(e, id).colapsado === true;

// ─── Lo puro ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe("Y38b — plegarElegidas", () => {
  it("una forma con hijos se pliega y el anuncio dice cuántas formas se ocultan", () => {
    const r = plegarElegidas(arbol(), ["a"]);
    expect(colapsado(r.escena, "a")).toBe(true);
    expect(r.anuncio).toBe("Rama plegada: 2 elementos ocultos.");
    expect(r.seleccion).toEqual(["a"]);
  });

  it("con un solo elemento oculto, en singular", () => {
    expect(plegarElegidas(arbol(), ["b"]).anuncio).toBe("Rama plegada: 1 elemento oculto.");
  });

  it("una forma plegada se despliega", () => {
    const r = plegarElegidas(plegada(arbol(), "a"), ["a"]);
    expect(colapsado(r.escena, "a")).toBe(false);
    expect(r.anuncio).toBe("Rama desplegada.");
  });

  it("varias a la vez: se plegan todas y el anuncio cuenta las formas ocultas", () => {
    const r = plegarElegidas(arbol(), ["a", "b"]);
    expect(colapsado(r.escena, "a") && colapsado(r.escena, "b")).toBe(true);
    expect(r.anuncio).toBe("2 ramas plegadas: 3 elementos ocultos.");
  });

  it("con una plegada y otra desplegada pliega (DY80); con todas plegadas, despliega", () => {
    const mezcla = plegarElegidas(plegada(arbol(), "a"), ["a", "b"]);
    expect(colapsado(mezcla.escena, "a")).toBe(true);
    expect(colapsado(mezcla.escena, "b")).toBe(true);
    const todas = plegarElegidas(plegada(arbol(), "a", "b"), ["a", "b"]);
    expect(colapsado(todas.escena, "a") || colapsado(todas.escena, "b")).toBe(false);
    expect(todas.anuncio).toBe("2 ramas desplegadas.");
  });

  it("una forma sin hijos, una línea, un grupo o nada elegido: no cambia y lo dice", () => {
    const e = arbol();
    for (const sel of [["a1"], [], ["no-existe"]]) {
      const r = plegarElegidas(e, sel);
      expect(r.escena).toBe(e);
      expect(r.anuncio).toBe("Elige una forma con ramas para plegarla.");
    }
    const conGrupo = escena(forma("x", 0, 0), forma("y", 200, 0), grupo("g", ["x", "y"]), linea("l", [[0, 0], [50, 50]]));
    expect(plegarElegidas(conGrupo, ["g"]).escena).toBe(conGrupo);
    expect(plegarElegidas(conGrupo, ["l"]).escena).toBe(conGrupo);
  });

  it("la selección se depura: lo que queda oculto sale, las formas plegadas se quedan", () => {
    const r = plegarElegidas(arbol(), ["a", "a1", "b1"]);
    expect(r.seleccion).toEqual(["a", "b1"]);
  });

  it("al desplegar la selección no pierde nada", () => {
    const r = plegarElegidas(plegada(arbol(), "a"), ["a", "b1"]);
    expect(colapsado(r.escena, "a")).toBe(false); // `b1` no tiene hijos y no cuenta: solo `a`, que está plegada, y se despliega
    expect(r.seleccion).toEqual(["a", "b1"]);
  });

  it("una rama plegada que no oculta nada (sus hijos se ven por otro camino) lo dice", () => {
    let e = escena(...["r", "p", "q", "h"].map((id, i) => forma(id, i * 120, 0)));
    for (const [a, b] of [["r", "p"], ["r", "q"], ["p", "h"], ["q", "h"]] as const) e = conectarFormas(e, a, b);
    const r = plegarElegidas(e, ["p"]);
    expect(r.anuncio).toBe("Rama plegada: no oculta ningún elemento.");
  });

  it("una forma bloqueada también se pliega (DY78)", () => {
    const e = escena(forma("p", 0, 0, 100, 60, { bloqueado: true }), forma("h", 200, 0));
    const r = plegarElegidas(conectarFormas(e, "p", "h"), ["p"]);
    expect(colapsado(r.escena, "p")).toBe(true);
  });
});

describe("Y38b — desplegarTodo", () => {
  it("quita el plegado de todas y conserva la selección", () => {
    const r = desplegarTodo(plegada(arbol(), "a", "b"), ["raiz"]);
    expect(r.escena.elementos.some((e) => e.tipo === "forma" && e.colapsado === true)).toBe(false);
    expect(r.seleccion).toEqual(["raiz"]);
    expect(r.anuncio).toBe("Todas las ramas desplegadas.");
  });

  it("sin ramas plegadas no cambia nada", () => {
    const e = arbol();
    const r = desplegarTodo(e, []);
    expect(r.escena).toBe(e);
    expect(r.anuncio).toBe("No hay ramas plegadas.");
  });
});

describe("Y38b — lo que ya no se elige ni se lee", () => {
  it("`elegibles` (Tab, Seleccionar todo) no incluye lo plegado, pero sí lo que se ve por otro camino", () => {
    const formas = (e: Escena): string[] => elegibles(e).filter((id) => e.elementos.find((x) => x.id === id)?.tipo === "forma");
    expect(formas(plegada(arbol(), "a"))).toEqual(["raiz", "a", "b", "b1"]);
    expect(elegibles(plegada(arbol(), "a"))).toHaveLength(7);
    expect(elegibles(arbol())).toHaveLength(11);
    let e = escena(...["r", "p", "q", "h"].map((id, i) => forma(id, i * 120, 0)));
    for (const [a, b] of [["r", "p"], ["r", "q"], ["p", "h"], ["q", "h"]] as const) e = conectarFormas(e, a, b);
    expect(elegibles(plegada(e, "p"))).toContain("h");
  });

  it("`capasDe` distingue lo plegado de lo oculto a mano", () => {
    const e = plegada(arbol(), "a");
    const capas = new Map(capasDe(e).map((c) => [c.id, c]));
    expect(capas.get("a1")?.plegado).toBe(true);
    expect(capas.get("a1")?.oculto).toBe(false);
    expect(capas.get("a")?.plegado).toBe(false);
    const aMano = escena(forma("x", 0, 0, 100, 60, { oculto: true }));
    expect(capasDe(aMano)[0]?.plegado).toBe(false);
    expect(capasDe(aMano)[0]?.oculto).toBe(true);
  });

  it("la lista para lectores no menciona lo plegado", () => {
    const ids = elementosAccesibles(plegada(arbol(), "a")).map((x) => x.id);
    expect(ids).not.toContain("a1");
    expect(ids).not.toContain("a2");
    expect(ids).toContain("a");
    expect(ids).toContain("b1");
  });

  it("sin plegar, la lista y las capas son las de siempre", () => {
    expect(elementosAccesibles(arbol()).map((x) => x.id)).toHaveLength(6 + 5); // 6 formas y 5 conectores
    expect(capasDe(arbol()).every((c) => !c.plegado)).toBe(true);
  });
});

describe("Y38b — el registro", () => {
  const ctx = (e: Escena, seleccion: string[]): ContextoComando => ({ escena: e, seleccion, herramienta: { tipo: "seleccionar" }, puedeDeshacer: false, puedeRehacer: false, zoom: 1, cuadricula: false, imantar: false });

  it("«Plegar o desplegar rama» está una sola vez, con atajo `/` solo en el lienzo", () => {
    expect(COMANDOS.filter((c) => c.orden.tipo === "plegar-rama")).toHaveLength(1);
    const c = comando("plegar-rama");
    expect(c.etiqueta).toBe("Plegar o desplegar rama");
    expect(c.soloLienzo).toBe(true);
    const tecla = (key: string, extra: object = {}) => ({ key, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, ...extra });
    expect(comandoDeTecla(tecla("/"))?.id).toBe("plegar-rama");
    expect(comandoDeTecla(tecla("/", { shiftKey: true }))?.id).toBe("plegar-rama"); // Mayús+7 en teclado español
    expect(comandoDeTecla(tecla("/", { ctrlKey: true }))?.id).not.toBe("plegar-rama");
  });

  it("se habilita solo con una forma con hijos elegida, y explica por qué no", () => {
    const c = comando("plegar-rama");
    expect(estadoComando(c, ctx(arbol(), ["a"])).habilitado).toBe(true);
    expect(estadoComando(c, ctx(arbol(), ["a1"]))).toMatchObject({ habilitado: false, motivo: "Elige una forma con ramas" });
    expect(estadoComando(c, ctx(arbol(), [])).habilitado).toBe(false);
  });

  it("«Desplegar todas las ramas» se habilita solo si hay alguna plegada", () => {
    const c = comando("desplegar-todo");
    expect(estadoComando(c, ctx(arbol(), []))).toMatchObject({ habilitado: false, motivo: "No hay ramas plegadas" });
    expect(estadoComando(c, ctx(plegada(arbol(), "a"), [])).habilitado).toBe(true);
  });

  it("el menú contextual los ofrece solo cuando sirven: sobre una forma con ramas, y sobre el vacío si hay plegadas", () => {
    const ids = (items: ElementoDeMenu[]): string[] => items.flatMap((x) => (x.clase === "comando" ? [x.item.def.id] : x.clase === "submenu" ? x.items.map((i) => i.def.id) : []));
    expect(ids(menuDe("forma", ctx(arbol(), ["a"])))).toContain("plegar-rama");
    expect(ids(menuDe("forma", ctx(arbol(), ["a1"])))).not.toContain("plegar-rama");
    expect(ids(menuDe("vacio", ctx(arbol(), [])))).not.toContain("desplegar-todo");
    expect(ids(menuDe("vacio", ctx(plegada(arbol(), "a"), [])))).toContain("desplegar-todo");
  });

  it("se encuentran en el buscador por sus sinónimos", () => {
    for (const q of ["colapsar", "contraer", "expandir", "plegar"]) expect(buscarComandos(q, COMANDOS).map((r) => r.comando.id), q).toContain("plegar-rama");
    expect(buscarComandos("expandir todo", COMANDOS).map((r) => r.comando.id)).toContain("desplegar-todo");
  });
});

// ─── El panel ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

function panel(e: Escena, seleccion: string[]) {
  const onRama = { plegar: vi.fn(), desplegarTodo: vi.fn() };
  render(<PanelPropiedades escena={e} seleccion={seleccion} onAplicar={vi.fn()} onVista={vi.fn()} onFinVista={vi.fn()} onSeleccionar={vi.fn()} onRama={onRama} />);
  return onRama;
}
const seccionRama = (): HTMLElement | null => document.querySelector<HTMLElement>("[data-rama-ajustes]");
const botonRama = (): HTMLButtonElement | null => document.querySelector<HTMLButtonElement>("[data-rama-plegar]");
const botonTodo = (): HTMLButtonElement | null => document.querySelector<HTMLButtonElement>("[data-rama-desplegar-todo]");

describe("Y38b — la sección «Rama» del panel", () => {
  it("aparece con una forma con hijos elegida, con la cuenta; no con una forma sin hijos ni sin nada", () => {
    panel(arbol(), ["raiz"]);
    expect(seccionRama()?.textContent).toContain("2 directos · 5 en toda la rama");
    cleanup();
    panel(arbol(), ["a1"]);
    expect(seccionRama()).toBeNull();
    cleanup();
    panel(arbol(), []);
    expect(seccionRama()).toBeNull();
  });

  it("el botón dice «Plegar rama» o «Desplegar rama» y pide la misma orden de siempre", () => {
    const o = panel(arbol(), ["a"]);
    expect(botonRama()?.textContent).toBe("Plegar rama");
    fireEvent.click(botonRama() as HTMLButtonElement);
    expect(o.plegar).toHaveBeenCalledTimes(1);
    cleanup();
    panel(plegada(arbol(), "a"), ["a"]);
    expect(botonRama()?.textContent).toBe("Desplegar rama");
  });

  it("«Desplegar todas las ramas» solo si hay alguna plegada", () => {
    panel(arbol(), ["a"]);
    expect(botonTodo()).toBeNull();
    cleanup();
    const o = panel(plegada(arbol(), "b"), ["a"]);
    fireEvent.click(botonTodo() as HTMLButtonElement);
    expect(o.desplegarTodo).toHaveBeenCalledTimes(1);
  });

  it("con varias ramas elegidas dice cuántas son; sin `onRama` el panel es el de siempre", () => {
    panel(arbol(), ["a", "b"]);
    expect(seccionRama()?.textContent).toContain("2 ramas elegidas");
    cleanup();
    render(<PanelPropiedades escena={arbol()} seleccion={["a"]} onAplicar={vi.fn()} onVista={vi.fn()} onFinVista={vi.fn()} onSeleccionar={vi.fn()} />);
    expect(seccionRama()).toBeNull();
  });

  it("ayudas: descendientes cuenta sin repetir ni colgarse con un ciclo", () => {
    let e = escena(...["x", "y", "z"].map((id, i) => forma(id, i * 120, 0)));
    for (const [a, b] of [["x", "y"], ["y", "z"], ["z", "x"]] as const) e = conectarFormas(e, a, b);
    expect(descendientesDe(e, "x")).toBe(2);
    expect(ramasElegidas(e, ["x", "q"])).toEqual(["x"]);
  });
});

// ─── El editor entero ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────

function editor(e: Escena) {
  const onCambio = vi.fn<(s: Escena) => void>();
  render(<EditorLibre escena={e} onCambio={onCambio} onCerrar={() => {}} />);
  const lienzo = screen.getByRole("application", { name: "Lienzo de dibujo" }) as unknown as SVGSVGElement;
  return {
    lienzo,
    ultima: () => onCambio.mock.calls.at(-1)?.[0] as Escena,
    cuenta: () => onCambio.mock.calls.length,
    anuncio: () => document.querySelector("[data-dibujo-anuncio]")?.textContent ?? "",
    deshacer: () => fireEvent.keyDown(lienzo, { key: "z", ctrlKey: true }),
    rehacer: () => fireEvent.keyDown(lienzo, { key: "y", ctrlKey: true }),
    elegir: (...ids: string[]) => ids.forEach((id, i) => fireEvent.click(screen.getByRole("button", { name: `Elegir ${nombreCapa(id)}` }), { shiftKey: i > 0 })),
  };
}
const nombreCapa = (id: string): string => `Rectángulo «${id}»`;
/** jsdom no trae `PointerEvent`: un `MouseEvent` con el nombre del evento llega igual al editor (como en las demás pruebas del lienzo). */
const evento = (tipo: string, en: Element, extra: MouseEventInit = {}): void => {
  fireEvent(en, new MouseEvent(tipo, { bubbles: true, cancelable: true, button: 0, ...extra }));
};
const circuloDe = (id: string): Element => document.querySelector(`[data-colapsar-id="${id}"] circle`) as Element;
const marcador = (id: string): Element | null => document.querySelector(`[data-colapsar-id="${id}"]`);
const dibujado = (id: string): boolean => document.querySelector(`[data-elemento-id="${id}"]`) !== null;

describe("Y38b — en el editor", () => {
  it("el lienzo dibuja el marcador «−» de las formas con hijos y «+N» de las plegadas", () => {
    editor(plegada(arbol(), "a"));
    expect(marcador("a")?.textContent).toBe("+2");
    expect(marcador("raiz")?.textContent).toBe("−");
    expect(marcador("a1")).toBeNull();
    expect(dibujado("a1")).toBe(false);
    expect(dibujado("a")).toBe(true);
  });

  it("la tecla `/` pliega lo elegido: una entrada de historial, anuncio, y deshacer/rehacer lo devuelven", () => {
    const m = editor(arbol());
    m.elegir("a");
    fireEvent.keyDown(m.lienzo, { key: "/" });
    expect(m.cuenta()).toBe(1);
    expect(colapsado(m.ultima(), "a")).toBe(true);
    expect(m.anuncio()).toBe("Rama plegada: 2 elementos ocultos.");
    expect(dibujado("a1")).toBe(false);
    m.deshacer();
    expect(colapsado(m.ultima(), "a")).toBe(false);
    expect(dibujado("a1")).toBe(true);
    m.rehacer();
    expect(colapsado(m.ultima(), "a")).toBe(true);
  });

  it("`/` otra vez la despliega", () => {
    const m = editor(arbol());
    m.elegir("a");
    fireEvent.keyDown(m.lienzo, { key: "/" });
    fireEvent.keyDown(m.lienzo, { key: "/" });
    expect(colapsado(m.ultima(), "a")).toBe(false);
    expect(m.anuncio()).toBe("Rama desplegada.");
  });

  it("con varias formas elegidas es una sola entrada de historial", () => {
    const m = editor(arbol());
    m.elegir("a", "b");
    fireEvent.keyDown(m.lienzo, { key: "/" });
    expect(m.cuenta()).toBe(1);
    expect(colapsado(m.ultima(), "a") && colapsado(m.ultima(), "b")).toBe(true);
  });

  it("sin nada elegido, o con una forma sin hijos, no cambia nada y lo dice", () => {
    const m = editor(arbol());
    fireEvent.keyDown(m.lienzo, { key: "/" });
    expect(m.cuenta()).toBe(0);
    expect(m.anuncio()).toBe("Elige una forma con ramas para plegarla.");
  });

  it("el comando de la cinta hace lo mismo", () => {
    const m = editor(arbol());
    m.elegir("a");
    fireEvent.click(botonCinta("Plegar o desplegar rama"));
    expect(colapsado(m.ultima(), "a")).toBe(true);
  });

  it("un clic en el marcador pliega esa rama, la deja elegida y es una sola entrada de historial", () => {
    const m = editor(arbol());
    evento("pointerdown", circuloDe("a"));
    expect(m.cuenta()).toBe(1);
    expect(colapsado(m.ultima(), "a")).toBe(true);
    expect(m.anuncio()).toBe("Rama plegada: 2 elementos ocultos.");
    // DY81: la forma queda elegida (el panel muestra su rama y su estado)
    expect(document.querySelector('[data-capa-id="a"]')?.getAttribute("aria-current")).toBe("true");
    expect(botonRama()?.textContent).toBe("Desplegar rama");
    evento("pointerdown", circuloDe("a"));
    expect(colapsado(m.ultima(), "a")).toBe(false);
    expect(m.cuenta()).toBe(2);
  });

  it("un clic en el marcador no mueve nada (la forma no cambia de sitio)", () => {
    const m = editor(arbol());
    evento("pointerdown", circuloDe("a"), { clientX: 100, clientY: 100 });
    evento("pointermove", m.lienzo, { clientX: 160, clientY: 160 });
    evento("pointerup", m.lienzo, { clientX: 160, clientY: 160 });
    expect(m.cuenta()).toBe(1);
    expect(getForma(m.ultima(), "a").transformacion).toEqual(getForma(arbol(), "a").transformacion);
  });

  it("con la forma elegida, el asa de la esquina gana al marcador (que cae justo debajo); fuera del asa, el marcador responde", () => {
    const m = editor(arbol());
    m.elegir("a");
    const g = document.querySelector("[data-dibujo-pagina]")?.parentElement?.getAttribute("transform") ?? "";
    const [, vx, vy, z] = (/translate\(([-\d.e]+) ([-\d.e]+)\) scale\(([-\d.e]+)\)/.exec(g) ?? []).map(Number);
    const esquina = { x: 170 + 100, y: 140 + 60 }; // abajo a la derecha de «a»
    const sobre = (dx: number) => ({ clientX: (vx as number) + esquina.x * (z as number) + dx, clientY: (vy as number) + esquina.y * (z as number) });
    evento("pointerdown", circuloDe("a"), sobre(0)); // justo en el asa de tamaño «se»
    evento("pointerup", m.lienzo, sobre(0));
    expect(m.cuenta()).toBe(0);
    expect(colapsado(m.ultima() ?? arbol(), "a")).toBe(false);
    evento("pointerdown", circuloDe("a"), sobre(10)); // a 10 px: fuera de la tolerancia del asa (8 px)
    expect(colapsado(m.ultima(), "a")).toBe(true);
  });

  it("un doble clic sobre el marcador no abre la edición del texto", () => {
    editor(arbol());
    fireEvent.doubleClick(circuloDe("a"));
    expect(document.querySelector("textarea")).toBeNull();
  });

  it("con otra herramienta el marcador no responde", () => {
    const m = editor(arbol());
    fireEvent.keyDown(m.lienzo, { key: "l" }); // herramienta de línea
    evento("pointerdown", circuloDe("a"));
    expect(colapsado(m.ultima() ?? arbol(), "a")).toBe(false);
    expect(m.cuenta()).toBe(0);
  });

  it("`Tab` y «Seleccionar todo» no pasan por lo plegado", () => {
    const m = editor(plegada(arbol(), "a"));
    fireEvent.keyDown(m.lienzo, { key: "a", ctrlKey: true });
    expect(m.anuncio()).toBe("7 elementos seleccionados."); // 4 formas (raiz, a, b, b1) y los 3 conectores que se ven; sin a1, a2 ni sus 2 conectores
  });

  it("«Desplegar todas las ramas» sale del menú de la cinta y deja todo a la vista", () => {
    const m = editor(plegada(arbol(), "a", "b"));
    fireEvent.click(botonCinta("Desplegar todas las ramas"));
    expect(m.cuenta()).toBe(1);
    expect(m.ultima().elementos.some((e) => e.tipo === "forma" && e.colapsado === true)).toBe(false);
    expect(m.anuncio()).toBe("Todas las ramas desplegadas.");
  });

  it("dentro de un campo de texto, `/` es un carácter y no pliega", () => {
    const m = editor(arbol());
    m.elegir("a");
    const campo = document.querySelector<HTMLInputElement>("input") as HTMLInputElement;
    fireEvent.keyDown(campo, { key: "/" });
    expect(m.cuenta()).toBe(0);
  });

  it("la capa plegada va atenuada, con su etiqueta, sin poder elegirse ni mostrarse a mano", () => {
    editor(plegada(arbol(), "a"));
    const fila = document.querySelector('[data-capa-id="a1"]') as HTMLElement;
    expect(fila.textContent).toContain("plegado");
    const elegir = fila.querySelector('button[aria-label^="Elegir"]') as HTMLButtonElement;
    expect(elegir.disabled).toBe(true);
    const ojo = fila.querySelector('button[aria-label^="Ocultar"], button[aria-label^="Mostrar"]') as HTMLButtonElement;
    expect(ojo.disabled).toBe(true);
    expect(ojo.title).toBe("Oculto por una rama plegada");
  });
});
