// Y32b: la galería «Iconos», los 30 comandos `forma-icono-*` y la inserción de un icono sin relleno.

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FORMAS, TIPOS_FORMA, TIPOS_ICONO, normalizarEscena, type Escena, type Forma } from "@lumina/drawing";
import { svgDeEscena } from "../exportar.js";
import { buscarComandos } from "./buscar-comandos.js";
import { CAMBIAR_FORMA, COMANDOS, comando, estadoComando, type ContextoComando } from "./comandos-registro.js";
import { EditorLibre } from "./editor-libre.js";
import { entradaForma } from "./herramientas.js";
import { PanelAtajos } from "./panel-atajos.js";
import { PALABRAS_DE_ICONO, SINONIMOS_POR_COMANDO } from "./sinonimos-comandos.js";
import { escena, forma, irAPestana } from "./util-pruebas.js";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

// ─── Lo puro ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe("Y32b — entradaForma", () => {
  const caja = { x: 10, y: 20, ancho: 64, alto: 64 };

  it("un icono nace sin relleno: la entrada lleva el estilo inicial del catálogo", () => {
    for (const id of TIPOS_ICONO) expect(entradaForma(id, caja)).toMatchObject({ tipo: "forma", forma: id, estilo: { relleno: { tipo: "ninguno" } } });
  });

  it("las 22 formas de siempre: la misma entrada que antes, sin `estilo`", () => {
    for (const t of TIPOS_FORMA) expect(entradaForma(t, caja)).toEqual({ tipo: "forma", forma: t, transformacion: { x: 10, y: 20, ancho: 64, alto: 64, rotacion: 0 } });
  });

  it("el normalizador completa el estilo parcial: contorno y demás quedan por defecto", () => {
    const e = normalizarEscena({ elementos: [{ id: "a", ...entradaForma("icono-reloj", caja) }] });
    const f = e.elementos[0] as Forma;
    expect(f.estilo.relleno).toEqual({ tipo: "ninguno" });
    expect(f.estilo.contorno.grosor).toBe(2);
    expect(f.estilo.opacidad).toBe(1);
  });
});

describe("Y32b — el registro", () => {
  const contexto = (herramienta: ContextoComando["herramienta"] = { tipo: "seleccionar" }): ContextoComando => ({ escena: escena(), seleccion: [], herramienta, puedeDeshacer: false, puedeRehacer: false, zoom: 1, cuadricula: false, imantar: false });

  it("hay un comando `forma-icono-*` por icono, con ids y etiquetas únicas", () => {
    const iconos = COMANDOS.filter((c) => c.id.startsWith("forma-icono-"));
    expect(iconos).toHaveLength(30);
    expect(iconos.map((c) => c.id)).toEqual(TIPOS_ICONO.map((t) => `forma-${t}`));
    expect(new Set(iconos.map((c) => c.etiqueta)).size).toBe(30);
    expect(comando("forma-icono-persona").etiqueta).toBe("Insertar icono Persona");
  });

  it("son herramientas de forma, sin menú contextual ni atajo", () => {
    for (const t of TIPOS_ICONO) {
      const c = comando(`forma-${t}`);
      expect(c.orden).toEqual({ tipo: "herramienta-forma", forma: t });
      expect(c.sinMenu).toBe(true);
      expect(c.atajos).toBeUndefined();
      expect(c.grupo).toBe("formas");
    }
  });

  it("están activos solo con su herramienta", () => {
    expect(estadoComando(comando("forma-icono-sol"), contexto({ tipo: "forma", forma: "icono-sol" })).activo).toBe(true);
    expect(estadoComando(comando("forma-icono-sol"), contexto({ tipo: "forma", forma: "icono-luna" })).activo).toBe(false);
    expect(estadoComando(comando("forma-icono-sol"), contexto()).activo).toBe(false);
  });

  it("no son destino de «Cambiar forma»: sigue habiendo 22", () => {
    expect(CAMBIAR_FORMA).toHaveLength(22);
    expect(CAMBIAR_FORMA.some((c) => c.id.includes("icono"))).toBe(false);
  });

  it("las 22 formas de siempre conservan sus comandos `forma-*`", () => {
    expect(COMANDOS.filter((c) => c.id.startsWith("forma-") && !c.id.startsWith("forma-icono-"))).toHaveLength(22);
  });

  it("cada icono tiene palabras para buscarlo, además de «icono» y «símbolo»", () => {
    for (const t of TIPOS_ICONO) {
      expect(PALABRAS_DE_ICONO[t].length).toBeGreaterThanOrEqual(2);
      expect(SINONIMOS_POR_COMANDO[`forma-${t}`]).toEqual(["icono", "simbolo", ...PALABRAS_DE_ICONO[t]]);
    }
  });

  it("`Ctrl+K` encuentra cada icono por su nombre y por al menos dos de sus palabras, sin acentos", () => {
    const ids = (q: string): string[] => buscarComandos(q, COMANDOS).map((r) => r.comando.id);
    for (const t of TIPOS_ICONO) {
      expect(ids(FORMAS[t].nombre), FORMAS[t].nombre).toContain(`forma-${t}`);
      for (const palabra of PALABRAS_DE_ICONO[t].slice(0, 2)) expect(ids(palabra), `${t}: ${palabra}`).toContain(`forma-${t}`);
    }
    expect(ids("QUIMICA")).toEqual(expect.arrayContaining(["forma-icono-matraz", "forma-icono-atomo"]));
    expect(ids("átomo")).toContain("forma-icono-atomo");
  });

  it("el panel de atajos no los lista (solo lista comandos con atajo)", () => {
    render(<PanelAtajos abierto onCerrar={() => {}} focoLienzo={() => {}} />);
    expect(document.body.textContent).not.toContain("Insertar icono");
  });
});

// ─── La galería ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

function montar(e: Escena = escena(forma("A", 400, 300, 100, 60))) {
  const onCambio = vi.fn<(e: Escena) => void>();
  render(<EditorLibre escena={e} titulo="Prueba" onCambio={onCambio} onCerrar={vi.fn()} />);
  const lienzo = screen.getByRole("application", { name: "Lienzo de dibujo" }) as unknown as SVGSVGElement;
  vi.spyOn(lienzo, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, right: 1000, bottom: 600, width: 1000, height: 600, x: 0, y: 0, toJSON: () => ({}) });
  const aPantalla = (x: number, y: number): { clientX: number; clientY: number } => {
    const g = document.querySelector("[data-dibujo-pagina]")?.parentElement?.getAttribute("transform") ?? "";
    const v = /translate\(([-\d.e]+) ([-\d.e]+)\) scale\(([-\d.e]+)\)/.exec(g);
    return { clientX: Number(v?.[1]) + x * Number(v?.[3]), clientY: Number(v?.[2]) + y * Number(v?.[3]) };
  };
  const clic = (x: number, y: number): void => {
    for (const tipo of ["pointerdown", "pointerup"]) fireEvent(lienzo, new MouseEvent(tipo, { bubbles: true, cancelable: true, button: 0, ...aPantalla(x, y) }));
  };
  return { onCambio, lienzo, clic, ultima: () => onCambio.mock.calls.at(-1)?.[0] as Escena, cuenta: () => onCambio.mock.calls.length };
}

const abrir = async (): Promise<HTMLElement> => {
  irAPestana("Insertar");
  fireEvent.click(document.querySelector("[data-galeria-iconos]") as HTMLElement);
  return waitFor(() => {
    const g = document.querySelector<HTMLElement>('[data-slot="popover-content"]');
    if (!g) throw new Error("la galería no se abrió");
    return g;
  });
};
const botones = (g: HTMLElement): HTMLButtonElement[] => [...g.querySelectorAll<HTMLButtonElement>("button[data-forma]")];
const boton = (g: HTMLElement, id: string): HTMLButtonElement => g.querySelector(`button[data-forma="${id}"]`) as HTMLButtonElement;
const campo = (g: HTMLElement): HTMLInputElement => g.querySelector('input[aria-label="Buscar icono"]') as HTMLInputElement;
const anuncio = (): string => document.querySelector("[data-dibujo-anuncio]")?.textContent ?? "";
const iconos = (e: Escena): Forma[] => e.elementos.filter((x): x is Forma => x.tipo === "forma" && x.forma.startsWith("icono-"));

describe("Y32b — la galería «Iconos»", () => {
  it("hay un solo botón «Iconos» en «Insertar», con el aviso de que abre una ventana", () => {
    montar();
    irAPestana("Insertar");
    const b = document.querySelectorAll("[data-galeria-iconos]");
    expect(b).toHaveLength(1);
    expect(b[0]?.getAttribute("aria-haspopup")).toBeTruthy();
  });

  it("al abrir: 5 grupos con sus nombres, 30 botones y un campo de búsqueda", async () => {
    montar();
    const g = await abrir();
    const grupos = [...g.querySelectorAll('[role="group"]')];
    expect(grupos.map((x) => x.getAttribute("aria-label"))).toEqual(["Personas y escuela", "Ciencia e ideas", "Estados y avisos", "Cosas", "Mundo y naturaleza"]);
    expect(botones(g)).toHaveLength(30);
    expect(campo(g)).toBeTruthy();
  });

  it("cada botón tiene el nombre del comando y una miniatura cuadrada", async () => {
    montar();
    const g = await abrir();
    for (const t of TIPOS_ICONO) {
      const b = boton(g, t);
      expect(b.getAttribute("aria-label")).toBe(comando(`forma-${t}`).etiqueta);
      expect(b.getAttribute("title")).toBe(FORMAS[t].nombre);
      const vb = b.querySelector("svg")?.getAttribute("viewBox")?.split(" ").map(Number) ?? [];
      expect(vb[2]).toBe(vb[3]);
      expect(b.querySelector("path")?.getAttribute("d")?.length).toBeGreaterThan(10);
    }
  });

  it("un clic elige la herramienta de esa forma y cierra la galería", async () => {
    const m = montar();
    const g = await abrir();
    fireEvent.click(boton(g, "icono-bombilla"));
    await waitFor(() => expect(document.querySelector('[data-slot="popover-content"]')).toBeNull());
    expect(m.cuenta()).toBe(0); // elegir la herramienta no agrega nada
    m.clic(200, 150); // un clic en el lienzo coloca el icono
    expect(m.cuenta()).toBe(1);
    const [icono] = iconos(m.ultima());
    expect(icono?.forma).toBe("icono-bombilla");
    expect(icono?.transformacion).toMatchObject({ ancho: 64, alto: 64 });
    expect(icono?.estilo.relleno).toEqual({ tipo: "ninguno" });
  });

  it("`Enter` sobre un icono lo coloca al centro, sin relleno, en una sola entrada de historial, y cierra", async () => {
    const m = montar();
    const g = await abrir();
    boton(g, "icono-reloj").focus();
    fireEvent.keyDown(boton(g, "icono-reloj"), { key: "Enter" });
    await waitFor(() => expect(document.querySelector('[data-slot="popover-content"]')).toBeNull());
    expect(m.cuenta()).toBe(1);
    expect(iconos(m.ultima())).toHaveLength(1);
    expect(iconos(m.ultima())[0]?.estilo.relleno).toEqual({ tipo: "ninguno" });
    expect(anuncio()).toBe("Reloj, seleccionado.");
  });

  it("colocar dos veces el mismo icono con `Enter` no los apila", async () => {
    const m = montar();
    for (let i = 0; i < 2; i++) {
      const g = await abrir();
      fireEvent.keyDown(boton(g, "icono-luna"), { key: "Enter" });
      await waitFor(() => expect(document.querySelector('[data-slot="popover-content"]')).toBeNull());
    }
    const dos = iconos(m.ultima());
    expect(dos).toHaveLength(2);
    expect(dos[0]?.transformacion.x === dos[1]?.transformacion.x && dos[0]?.transformacion.y === dos[1]?.transformacion.y).toBe(false);
  });

  it("las flechas recorren los botones y las de arriba y abajo saltan una fila", async () => {
    montar();
    const g = await abrir();
    const todos = botones(g);
    todos[0]?.focus();
    fireEvent.keyDown(todos[0] as HTMLElement, { key: "ArrowRight" });
    expect(document.activeElement).toBe(todos[1]);
    fireEvent.keyDown(todos[1] as HTMLElement, { key: "ArrowDown" });
    expect(document.activeElement).toBe(todos[7]);
    fireEvent.keyDown(todos[7] as HTMLElement, { key: "ArrowUp" });
    expect(document.activeElement).toBe(todos[1]);
    fireEvent.keyDown(todos[1] as HTMLElement, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(todos[0]);
  });

  it("`Escape` cierra y devuelve el foco al botón «Iconos»", async () => {
    montar();
    const g = await abrir();
    fireEvent.keyDown(boton(g, "icono-sol"), { key: "Escape" });
    await waitFor(() => expect(document.querySelector('[data-slot="popover-content"]')).toBeNull());
    expect(document.activeElement).toBe(document.querySelector("[data-galeria-iconos]"));
  });
});

describe("Y32b — la búsqueda", () => {
  const escribir = (g: HTMLElement, valor: string): void => void fireEvent.change(campo(g), { target: { value: valor } });
  const visibles = (g: HTMLElement): string[] => botones(g).map((b) => b.getAttribute("data-forma") as string);

  it("por nombre, sin mayúsculas ni acentos", async () => {
    montar();
    const g = await abrir();
    escribir(g, "ÁTOMO");
    expect(visibles(g)).toEqual(["icono-atomo"]);
  });

  it("por una palabra: «idea» encuentra la bombilla", async () => {
    montar();
    const g = await abrir();
    escribir(g, "idea");
    expect(visibles(g)).toEqual(["icono-bombilla"]);
  });

  it("por una palabra que comparten varios", async () => {
    montar();
    const g = await abrir();
    escribir(g, "quimica");
    expect(visibles(g)).toEqual(["icono-matraz", "icono-atomo"]);
  });

  it("los grupos sin resultados se ocultan", async () => {
    montar();
    const g = await abrir();
    escribir(g, "idea");
    expect([...g.querySelectorAll('[role="group"]')].map((x) => x.getAttribute("aria-label"))).toEqual(["Ciencia e ideas"]);
  });

  it("sin resultados: un mensaje en una región de estado, y al borrar vuelven los 30", async () => {
    montar();
    const g = await abrir();
    escribir(g, "zzzz");
    expect(botones(g)).toHaveLength(0);
    expect(g.querySelector('[role="status"]')?.textContent).toBe("No hay iconos con ese nombre");
    escribir(g, "");
    expect(botones(g)).toHaveLength(30);
    expect(g.querySelector('[role="status"]')).toBeNull();
  });

  it("la búsqueda se borra al cerrar", async () => {
    montar();
    let g = await abrir();
    escribir(g, "idea");
    fireEvent.keyDown(campo(g), { key: "Escape" });
    await waitFor(() => expect(document.querySelector('[data-slot="popover-content"]')).toBeNull());
    g = await abrir();
    expect(campo(g).value).toBe("");
    expect(botones(g)).toHaveLength(30);
  });

  it("las teclas del campo no llegan al editor: `Supr` no borra lo elegido", async () => {
    const m = montar();
    m.clic(450, 330); // elige «A»
    const g = await abrir();
    fireEvent.keyDown(campo(g), { key: "Delete" });
    expect(m.cuenta()).toBe(0);
  });
});

describe("Y32b — un icono ya colocado", () => {
  const colocar = async (m: ReturnType<typeof montar>, id: string): Promise<void> => {
    const g = await abrir();
    fireEvent.keyDown(boton(g, id), { key: "Enter" });
    await waitFor(() => expect(document.querySelector('[data-slot="popover-content"]')).toBeNull());
    void m;
  };

  it("se puede cambiar a una de las 22 formas y conserva su estilo", async () => {
    const m = montar();
    await colocar(m, "icono-casa");
    irAPestana("Formato de forma");
    const cambiar = document.querySelector("[data-cambiar-forma]") as HTMLElement;
    expect(cambiar).toBeTruthy();
    fireEvent.click(cambiar);
    const galeria = await waitFor(() => {
      const g = document.querySelector<HTMLElement>('[data-slot="popover-content"]');
      if (!g) throw new Error("sin galería");
      return g;
    });
    fireEvent.click(galeria.querySelector('button[data-forma="rombo"]') as HTMLElement);
    const f = iconos(m.ultima());
    expect(f).toHaveLength(0);
    const rombo = m.ultima().elementos.find((e): e is Forma => e.tipo === "forma" && e.forma === "rombo");
    expect(rombo?.estilo.relleno).toEqual({ tipo: "ninguno" });
  });

  it("se exporta a SVG con su trazado y sin relleno", async () => {
    const m = montar();
    await colocar(m, "icono-engranaje");
    const svg = svgDeEscena(m.ultima(), { tema: "claro", fondo: true }).svg;
    expect(svg).toContain('fill="none"');
    expect(svg).toContain('stroke-linecap="round"');
    expect(svg).not.toContain("var(");
  });

  it("se le puede crear un hijo con el teclado (Ctrl+Enter)", async () => {
    const m = montar();
    await colocar(m, "icono-persona");
    fireEvent.keyDown(m.lienzo, { key: "Enter", ctrlKey: true });
    expect(m.ultima().elementos.filter((e) => e.tipo === "forma" && e.forma.startsWith("icono-") || e.tipo === "forma").length).toBeGreaterThanOrEqual(3);
  });
});
