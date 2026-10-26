// Y32b: la galería «Iconos», los 30 comandos `forma-icono-*` y la inserción de un icono sin relleno.

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FORMAS, TIPOS_FORMA, TIPOS_ICONO, normalizarEscena, type Escena, type Forma } from "@lumina/drawing";
import { svgDeEscena } from "../exportar.js";
import { buscarComandos } from "./buscar-comandos.js";
import { CAMBIAR_FORMA, COMANDOS, comando, estadoComando, type ContextoComando } from "./comandos-registro.js";
import { EditorLibre } from "./editor-libre.js";
import { ContenidoGaleriaIconos } from "./galeria-iconos.js";
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

// ─── El contenido de la galería, sin abrir el Popover (abrirlo en jsdom tarda decenas de segundos) ───────────────────────────────────────

const contextoBase: ContextoComando = { escena: escena(), seleccion: [], herramienta: { tipo: "seleccionar" }, puedeDeshacer: false, puedeRehacer: false, zoom: 1, cuadricula: false, imantar: false };

function contenido(extra: { herramienta?: ContextoComando["herramienta"]; colocar?: boolean } = {}) {
  const onOrden = vi.fn();
  const onColocarForma = vi.fn();
  const alElegir = vi.fn();
  const r = render(
    <ContenidoGaleriaIconos contexto={{ ...contextoBase, ...(extra.herramienta ? { herramienta: extra.herramienta } : {}) }} onOrden={onOrden} {...(extra.colocar === false ? {} : { onColocarForma })} alElegir={alElegir} />,
  );
  return { onOrden, onColocarForma, alElegir, ...r };
}
const botones = (): HTMLButtonElement[] => [...document.querySelectorAll<HTMLButtonElement>("button[data-forma]")];
const boton = (id: string): HTMLButtonElement => document.querySelector(`button[data-forma="${id}"]`) as HTMLButtonElement;
const campo = (): HTMLInputElement => document.querySelector('input[aria-label="Buscar icono"]') as HTMLInputElement;
const escribir = (valor: string): void => void fireEvent.change(campo(), { target: { value: valor } });
const visibles = (): string[] => botones().map((b) => b.getAttribute("data-forma") as string);

describe("Y32b — el contenido de la galería", () => {
  it("5 grupos con sus nombres, 30 botones y un campo de búsqueda", () => {
    contenido();
    const grupos = [...document.querySelectorAll('[role="group"]')];
    expect(grupos.map((x) => x.getAttribute("aria-label"))).toEqual(["Personas y escuela", "Ciencia e ideas", "Estados y avisos", "Cosas", "Mundo y naturaleza"]);
    expect(botones()).toHaveLength(30);
    expect(campo()).toBeTruthy();
  });

  it("cada botón tiene el nombre del comando y una miniatura cuadrada con su trazado", () => {
    contenido();
    for (const t of TIPOS_ICONO) {
      const b = boton(t);
      expect(b.getAttribute("aria-label")).toBe(comando(`forma-${t}`).etiqueta);
      expect(b.getAttribute("title")).toBe(FORMAS[t].nombre);
      const vb = b.querySelector("svg")?.getAttribute("viewBox")?.split(" ").map(Number) ?? [];
      expect(vb[2]).toBe(vb[3]);
      expect(b.querySelector("path")?.getAttribute("d")?.length).toBeGreaterThan(10);
    }
  });

  it("un clic pide la orden de esa herramienta y avisa que se eligió (la galería se cierra)", () => {
    const m = contenido();
    fireEvent.click(boton("icono-bombilla"));
    expect(m.onOrden).toHaveBeenCalledWith({ tipo: "herramienta-forma", forma: "icono-bombilla" });
    expect(m.alElegir).toHaveBeenCalledTimes(1);
    expect(m.onColocarForma).not.toHaveBeenCalled();
  });

  it("`Enter` sobre un icono lo coloca (y no elige la herramienta)", () => {
    const m = contenido();
    fireEvent.keyDown(boton("icono-reloj"), { key: "Enter" });
    expect(m.onColocarForma).toHaveBeenCalledWith("icono-reloj");
    expect(m.alElegir).toHaveBeenCalledTimes(1);
    expect(m.onOrden).not.toHaveBeenCalled();
  });

  it("`Enter` con Ctrl, o sin quien coloque, no coloca", () => {
    const m = contenido();
    fireEvent.keyDown(boton("icono-reloj"), { key: "Enter", ctrlKey: true });
    expect(m.onColocarForma).not.toHaveBeenCalled();
    cleanup();
    const n = contenido({ colocar: false });
    fireEvent.keyDown(boton("icono-reloj"), { key: "Enter" });
    expect(n.onColocarForma).not.toHaveBeenCalled();
  });

  it("el icono de la herramienta elegida va marcado", () => {
    contenido({ herramienta: { tipo: "forma", forma: "icono-sol" } });
    expect(boton("icono-sol").getAttribute("aria-pressed")).toBe("true");
    expect(boton("icono-luna").getAttribute("aria-pressed")).toBe("false");
  });

  it("las flechas recorren los botones y las de arriba y abajo saltan una fila", () => {
    contenido();
    const todos = botones();
    todos[0]?.focus();
    fireEvent.keyDown(todos[0] as HTMLElement, { key: "ArrowRight" });
    expect(document.activeElement).toBe(todos[1]);
    fireEvent.keyDown(todos[1] as HTMLElement, { key: "ArrowDown" });
    expect(document.activeElement).toBe(todos[7]);
    fireEvent.keyDown(todos[7] as HTMLElement, { key: "ArrowUp" });
    expect(document.activeElement).toBe(todos[1]);
    fireEvent.keyDown(todos[1] as HTMLElement, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(todos[0]);
    fireEvent.keyDown(todos[0] as HTMLElement, { key: "ArrowLeft" }); // no se sale por el principio
    expect(document.activeElement).toBe(todos[0]);
    todos[29]?.focus();
    fireEvent.keyDown(todos[29] as HTMLElement, { key: "ArrowDown" }); // ni por el final
    expect(document.activeElement).toBe(todos[29]);
  });

  it("las teclas de la galería no llegan a quien la contiene (el editor)", () => {
    const alta = vi.fn();
    render(
      <div onKeyDown={alta}>
        <ContenidoGaleriaIconos contexto={contextoBase} onOrden={vi.fn()} alElegir={vi.fn()} />
      </div>,
    );
    fireEvent.keyDown(campo(), { key: "Delete" });
    fireEvent.keyDown(boton("icono-sol"), { key: "ArrowRight" });
    expect(alta).not.toHaveBeenCalled();
  });
});

describe("Y32b — la búsqueda", () => {
  it("por nombre, sin mayúsculas ni acentos", () => {
    contenido();
    escribir("ÁTOMO");
    expect(visibles()).toEqual(["icono-atomo"]);
  });

  it("por una palabra: «idea» encuentra la bombilla", () => {
    contenido();
    escribir("idea");
    expect(visibles()).toEqual(["icono-bombilla"]);
  });

  it("por una palabra que comparten varios", () => {
    contenido();
    escribir("quimica");
    expect(visibles()).toEqual(["icono-matraz", "icono-atomo"]);
  });

  it("«icono» y «símbolo» encuentran todos", () => {
    contenido();
    escribir("icono");
    expect(botones()).toHaveLength(30);
    escribir("Símbolo");
    expect(botones()).toHaveLength(30);
  });

  it("los grupos sin resultados se ocultan", () => {
    contenido();
    escribir("idea");
    expect([...document.querySelectorAll('[role="group"]')].map((x) => x.getAttribute("aria-label"))).toEqual(["Ciencia e ideas"]);
  });

  it("sin resultados: un mensaje en una región de estado, y al borrar vuelven los 30", () => {
    contenido();
    escribir("zzzz");
    expect(botones()).toHaveLength(0);
    expect(document.querySelector('[role="status"]')?.textContent).toBe("No hay iconos con ese nombre");
    escribir("");
    expect(botones()).toHaveLength(30);
    expect(document.querySelector('[role="status"]')).toBeNull();
  });

  it("la búsqueda se borra al volver a montar (al cerrar la galería se desmonta)", () => {
    const m = contenido();
    escribir("idea");
    m.unmount();
    contenido();
    expect(campo().value).toBe("");
    expect(botones()).toHaveLength(30);
  });
});

// ─── En el editor entero (abrir el Popover es lento en jsdom: pocas pruebas, cada una con varias comprobaciones) ──────────────────────

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
  }, { timeout: 120000 });
};
const cerrada = (): Promise<void> => waitFor(() => expect(document.querySelector('[data-slot="popover-content"]')).toBeNull(), { timeout: 120000 });
const anuncio = (): string => document.querySelector("[data-dibujo-anuncio]")?.textContent ?? "";
const iconos = (e: Escena): Forma[] => e.elementos.filter((x): x is Forma => x.tipo === "forma" && x.forma.startsWith("icono-"));
const TOPE = { timeout: 280000 };

describe("Y32b — la galería «Iconos» dentro del editor", () => {
  it("un solo botón en «Insertar»; abre con los 5 grupos; `Escape` devuelve el foco; un clic elige la herramienta y el siguiente clic en el lienzo coloca el icono sin relleno", TOPE, async () => {
    const m = montar();
    irAPestana("Insertar");
    expect(document.querySelectorAll("[data-galeria-iconos]")).toHaveLength(1);
    expect(document.querySelector("[data-galeria-iconos]")?.getAttribute("aria-haspopup")).toBeTruthy();

    let g = await abrir();
    expect(g.querySelectorAll("button[data-forma]")).toHaveLength(30);
    expect(g.querySelectorAll('[role="group"]')).toHaveLength(5);
    fireEvent.keyDown(g.querySelector("button[data-forma]") as HTMLElement, { key: "Escape" });
    await cerrada();
    expect(document.activeElement).toBe(document.querySelector("[data-galeria-iconos]"));

    g = await abrir();
    fireEvent.click(g.querySelector('button[data-forma="icono-bombilla"]') as HTMLElement);
    await cerrada();
    expect(m.cuenta()).toBe(0); // elegir la herramienta no agrega nada
    m.clic(200, 150);
    expect(m.cuenta()).toBe(1);
    const [icono] = iconos(m.ultima());
    expect(icono?.forma).toBe("icono-bombilla");
    expect(icono?.transformacion).toMatchObject({ ancho: 64, alto: 64 });
    expect(icono?.estilo.relleno).toEqual({ tipo: "ninguno" });
  });

  it("`Enter` coloca al centro, sin relleno, en una entrada de historial cada vez, sin apilarlos; y el icono colocado se exporta, admite un hijo y se cambia a otra forma", TOPE, async () => {
    const m = montar();
    let g = await abrir();
    fireEvent.keyDown(g.querySelector('button[data-forma="icono-reloj"]') as HTMLElement, { key: "Enter" });
    await cerrada();
    expect(m.cuenta()).toBe(1);
    expect(iconos(m.ultima())).toHaveLength(1);
    expect(iconos(m.ultima())[0]?.estilo.relleno).toEqual({ tipo: "ninguno" });
    expect(anuncio()).toBe("Reloj agregado.");

    g = await abrir();
    fireEvent.keyDown(g.querySelector('button[data-forma="icono-reloj"]') as HTMLElement, { key: "Enter" });
    await cerrada();
    const dos = iconos(m.ultima());
    expect(dos).toHaveLength(2);
    expect(dos[0]?.transformacion.x === dos[1]?.transformacion.x && dos[0]?.transformacion.y === dos[1]?.transformacion.y).toBe(false);

    // Se exporta con su trazado, sin relleno y sin variables CSS.
    const svg = svgDeEscena(m.ultima(), { tema: "claro", fondo: true }).svg;
    expect(svg).toContain('fill="none"');
    expect(svg).toContain('stroke-linecap="round"');
    expect(svg).not.toContain("var(");

    // Admite un hijo con el teclado (Ctrl+Enter sobre el icono elegido).
    const antes = m.ultima().elementos.filter((e) => e.tipo === "forma").length;
    fireEvent.keyDown(m.lienzo, { key: "Enter", ctrlKey: true });
    expect(m.ultima().elementos.filter((e) => e.tipo === "forma").length).toBe(antes + 1);
  });

  it("un icono colocado se puede cambiar a una de las 22 formas y conserva su estilo", TOPE, async () => {
    const m = montar();
    const g = await abrir();
    fireEvent.keyDown(g.querySelector('button[data-forma="icono-casa"]') as HTMLElement, { key: "Enter" });
    await cerrada();
    irAPestana("Formato de forma");
    fireEvent.click(document.querySelector("[data-cambiar-forma]") as HTMLElement);
    const galeria = await waitFor(
      () => {
        const x = document.querySelector<HTMLElement>('[data-slot="popover-content"]');
        if (!x) throw new Error("sin galería");
        return x;
      },
      { timeout: 120000 },
    );
    fireEvent.click(galeria.querySelector('button[data-forma="rombo"]') as HTMLElement);
    expect(iconos(m.ultima())).toHaveLength(0);
    const rombo = m.ultima().elementos.find((e): e is Forma => e.tipo === "forma" && e.forma === "rombo");
    expect(rombo?.estilo.relleno).toEqual({ tipo: "ninguno" });
  });
});
