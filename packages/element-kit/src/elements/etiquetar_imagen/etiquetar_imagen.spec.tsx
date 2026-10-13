/**
 * U16 — Etiquetar imagen (actividad nueva). Viewer: «tocar y colocar» (una etiqueta por marcador,
 * devolver al banco), comprobar, resultado, reintento, tiempo, imagen que no carga; definición:
 * registro, catálogo, por defecto; editor y propiedades (colocar, mover y quitar marcadores); y el
 * cruce viewer → scoring (la respuesta que emite el viewer, evaluada por `@lumina/scoring`, da la
 * nota esperada). El arrastre con ratón lo cubre el motor común (`ubicar-elementos`, U10.4).
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse } from "@lumina/scoring";
import type { EtiquetarImagenActivity } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { elementRegistry } from "../../index.js";
import { createDefaultEtiquetarImagen } from "../../activities/etiquetar-imagen/etiquetar-imagen-defaults.js";
import { normalizarEtiquetarImagen } from "../../activities/etiquetar-imagen/etiquetar-imagen-config.js";
import { validarActividad } from "../../activities/_shared/produccion/validacion.js";
import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { etiquetarImagenDefinition as def } from "./etiquetar_imagen-definition.js";

type PropsViewer = { estado: unknown; config: Record<string, unknown> };
const Viewer = def.Viewer as unknown as (p: PropsViewer) => React.ReactElement;
const Editor = def.Editor as unknown as (p: { estado: unknown; config: object; onChange(e: unknown): void }) => React.ReactElement;
const Propiedades = def.Propiedades as unknown as (p: {
  estado: unknown;
  config: object;
  onChange(e: unknown): void;
  onConfigChange(c: object): void;
}) => React.ReactElement;

beforeEach(() => play.mockClear());
afterEach(cleanup);

const base = (parche: Partial<EtiquetarImagenActivity> = {}): EtiquetarImagenActivity => ({
  tipo: "etiquetar_imagen",
  instruccion: "Etiqueta la célula.",
  imagen: "celula.png",
  textoAlternativo: "Una célula",
  zonas: [
    { id: "z1", x: 0.5, y: 0.5, etiquetaId: "e1" },
    { id: "z2", x: 0.9, y: 0.5, etiquetaId: "e2" },
  ],
  etiquetas: [
    { id: "e1", texto: "Núcleo" },
    { id: "e2", texto: "Membrana" },
    { id: "e3", texto: "Pared" },
  ],
  ...parche,
});

/** Monta el viewer ya en modo «tocar y colocar» (el arrastre no se simula en jsdom). */
const montar = (a: EtiquetarImagenActivity = base()) => {
  const onResponse = vi.fn();
  const r = render(<Viewer estado={a} config={{ onResponse }} />);
  fireEvent.click(screen.getByRole("button", { name: "Modo: arrastrar" }));
  return { onResponse, ...r };
};
const zona = (id: string) => document.querySelector(`[data-zona-id="${id}"]`) as HTMLElement;
const etiqueta = (texto: string) => screen.getByRole("button", { name: texto });
const colocar = (texto: string, z: string) => {
  fireEvent.click(etiqueta(texto));
  fireEvent.click(zona(z));
};
const comprobar = () => fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
const anuncio = () => screen.getByTestId("anuncio-tocar-colocar").textContent;
const banco = () => screen.getByRole("group", { name: "Banco de etiquetas" });
const enBanco = () => [...banco().querySelectorAll("[aria-roledescription]")].map((n) => n.textContent);
/** jsdom no trae `PointerEvent`: un `MouseEvent` con el tipo de puntero lleva las coordenadas. */
const puntero = (el: Element, tipo: string, x: number, y: number) =>
  act(() => void el.dispatchEvent(new MouseEvent(tipo, { bubbles: true, clientX: x, clientY: y })));

describe("Viewer — colocar etiquetas", () => {
  it("muestra la instrucción, la imagen con su texto alternativo, los marcadores numerados y el banco", () => {
    montar();
    expect(screen.getByText("Etiqueta la célula.")).toBeTruthy();
    expect(screen.getByAltText("Una célula").getAttribute("src")).toBe("celula.png");
    expect(zona("z1").textContent).toBe("1");
    expect(zona("z2").textContent).toBe("2");
    expect(enBanco().sort()).toEqual(["Membrana", "Núcleo", "Pared"]);
  });
  it("los marcadores se posicionan en porcentaje de la imagen", () => {
    montar();
    expect(zona("z2").style.left).toBe("90%");
    expect(zona("z2").style.top).toBe("50%");
  });
  it("elegir una etiqueta y luego un marcador la coloca, la saca del banco y lo anuncia", () => {
    montar();
    fireEvent.click(etiqueta("Núcleo"));
    expect(anuncio()).toContain("Elegiste Núcleo");
    fireEvent.click(zona("z1"));
    expect(anuncio()).toBe("Colocaste Núcleo en el marcador 1.");
    expect(enBanco()).not.toContain("Núcleo");
    expect(zona("z1").getAttribute("aria-label")).toBe("Marcador 1: Núcleo. Pulsa para devolverla al banco.");
  });
  it("un marcador admite UNA etiqueta: colocar otra devuelve la anterior al banco", () => {
    montar();
    colocar("Núcleo", "z1");
    colocar("Pared", "z1");
    expect(enBanco().sort()).toEqual(["Membrana", "Núcleo"]);
    expect(zona("z1").getAttribute("aria-label")).toContain("Pared");
  });
  it("mover una etiqueta ya colocada a otro marcador libera el primero", () => {
    montar();
    colocar("Núcleo", "z1");
    // La etiqueta colocada se devuelve al banco con un toque y se vuelve a elegir desde allí.
    fireEvent.click(zona("z1"));
    expect(enBanco()).toContain("Núcleo");
    colocar("Núcleo", "z2");
    expect(zona("z1").getAttribute("aria-label")).toBe("Marcador 1, vacío");
    expect(zona("z2").getAttribute("aria-label")).toContain("Núcleo");
  });
  it("tocar un marcador ocupado, sin nada elegido, devuelve su etiqueta al banco; con Enter también", () => {
    montar();
    colocar("Membrana", "z2");
    fireEvent.keyDown(zona("z2"), { key: "Enter" });
    expect(enBanco()).toContain("Membrana");
    expect(zona("z2").getAttribute("aria-label")).toBe("Marcador 2, vacío");
  });
  it("Escape cancela la elección", () => {
    montar();
    fireEvent.click(etiqueta("Núcleo"));
    fireEvent.keyDown(etiqueta("Núcleo"), { key: "Escape" });
    expect(etiqueta("Núcleo").getAttribute("aria-pressed")).toBe("false");
    expect(anuncio()).toContain("Cancelaste");
  });
  it("«Comprobar» está deshabilitado hasta que haya una etiqueta colocada", () => {
    montar();
    expect((screen.getByRole("button", { name: "Comprobar" }) as HTMLButtonElement).disabled).toBe(true);
    colocar("Núcleo", "z1");
    expect((screen.getByRole("button", { name: "Comprobar" }) as HTMLButtonElement).disabled).toBe(false);
  });
  it("en modo arrastrar las etiquetas se anuncian como arrastrables", () => {
    render(<Viewer estado={base()} config={{}} />);
    expect(screen.getByText("Núcleo").getAttribute("aria-roledescription")).toBe("elemento arrastrable");
  });
});

describe("Viewer — comprobar y resultado", () => {
  it("emite [{ zonaId, etiquetaId }] solo de los marcadores con etiqueta, suena y abre el resultado", () => {
    const { onResponse } = montar();
    colocar("Membrana", "z2");
    colocar("Núcleo", "z1");
    comprobar();
    expect(onResponse).toHaveBeenCalledTimes(1);
    expect(onResponse).toHaveBeenCalledWith([
      { zonaId: "z1", etiquetaId: "e1" },
      { zonaId: "z2", etiquetaId: "e2" },
    ]);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByLabelText("Nota 5.0 de 5")).toBeTruthy();
    expect(play).toHaveBeenCalledWith("correct");
  });
  it("marca cada marcador correcto/incorrecto con palabras, no solo con color", () => {
    montar();
    colocar("Núcleo", "z1");
    colocar("Pared", "z2");
    comprobar();
    expect(screen.getByLabelText("Núcleo, correcto")).toBeTruthy();
    expect(screen.getByLabelText("Pared, incorrecto")).toBeTruthy();
    expect(play).toHaveBeenCalledWith("wrong");
    expect(screen.getByLabelText("Nota 2.5 de 5")).toBeTruthy();
  });
  it("tras comprobar ya no se puede cambiar nada", () => {
    montar();
    colocar("Núcleo", "z1");
    comprobar();
    expect(screen.queryByRole("button", { name: "Comprobar" })).toBeNull();
    expect(anuncio()).toBe("Colocaste Núcleo en el marcador 1.");
  });
  it("con intentos > 1 permite reintentar y vuelve a empezar con todas las etiquetas en el banco", () => {
    const { onResponse } = montar(base({ ajustes: { intentos: 2 } }));
    colocar("Núcleo", "z1");
    comprobar();
    fireEvent.click(screen.getByRole("button", { name: /Reintentar/ }));
    expect(enBanco()).toHaveLength(3);
    expect(zona("z1").getAttribute("aria-label")).toBe("Marcador 1, vacío");
    colocar("Núcleo", "z1");
    colocar("Membrana", "z2");
    comprobar();
    expect(onResponse).toHaveBeenCalledTimes(2);
  });
  it("con la misma semilla el banco sale en el mismo orden para todos", () => {
    const a = base({ ajustes: { semilla: 42 } });
    montar(a);
    const uno = enBanco();
    cleanup();
    montar(a);
    expect(enBanco()).toEqual(uno);
  });
  it("no emite nada si no se comprueba", () => {
    const { onResponse } = montar();
    colocar("Núcleo", "z1");
    expect(onResponse).not.toHaveBeenCalled();
  });
});

describe("Viewer — tiempo, imagen y contenido", () => {
  it("se acaba el tiempo: se envía lo colocado hasta ahí (una vez) y se avisa", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
    try {
      const { onResponse } = montar(base({ ajustes: { tiempoLimiteSeg: 5 } }));
      colocar("Núcleo", "z1");
      act(() => void vi.advanceTimersByTime(6000));
      expect(onResponse).toHaveBeenCalledTimes(1);
      expect(onResponse).toHaveBeenCalledWith([{ zonaId: "z1", etiquetaId: "e1" }]);
      expect(screen.getByText("Se acabó el tiempo.")).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });
  it("si la imagen no carga, se degrada con aviso y el texto alternativo, y los marcadores siguen ahí", () => {
    montar();
    fireEvent.error(screen.getByAltText("Una célula"));
    expect(screen.getByText("No se pudo cargar la imagen.")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Una célula" })).toBeTruthy();
    expect(zona("z1")).toBeTruthy();
  });
  it("sin imagen configurada avisa que falta", () => {
    montar(base({ imagen: "" }));
    expect(screen.getByText("Esta actividad aún no tiene imagen.")).toBeTruthy();
  });
  it("al cargar, la caja toma la proporción real de la imagen (sin saltos de diseño)", () => {
    montar();
    const img = screen.getByAltText("Una célula");
    Object.defineProperty(img, "naturalWidth", { value: 400 });
    Object.defineProperty(img, "naturalHeight", { value: 200 });
    fireEvent.load(img);
    expect((img.parentElement as HTMLElement).style.aspectRatio).toBe("2");
  });
  it("editar el contenido reinicia lo colocado", () => {
    const a = base();
    const { rerender } = montar(a);
    colocar("Núcleo", "z1");
    rerender(<Viewer estado={base({ instruccion: "Otra" })} config={{}} />);
    expect(enBanco()).toHaveLength(3);
  });
  it("cambiar solo un ajuste (estilo) no reinicia lo colocado", () => {
    const a = base();
    const { rerender } = montar(a);
    colocar("Núcleo", "z1");
    rerender(<Viewer estado={{ ...a, ajustes: { estilo: "arcade" } }} config={{}} />);
    expect(enBanco()).not.toContain("Núcleo");
  });
});

describe("Cruce viewer → scoring", () => {
  const nota = (a: EtiquetarImagenActivity, colocadas: [string, string][]) => {
    const { onResponse } = montar(a);
    for (const [texto, z] of colocadas) colocar(texto, z);
    comprobar();
    return evaluateActivityResponse("etiquetar_imagen", a, onResponse.mock.calls[0]![0]).score;
  };
  it("perfecto → 5.0; uno de dos → 2.5; distractor colocado → 1.0", () => {
    expect(nota(base(), [["Núcleo", "z1"], ["Membrana", "z2"]])).toBe(5);
    cleanup();
    expect(nota(base(), [["Núcleo", "z1"]])).toBe(2.5);
    cleanup();
    expect(nota(base(), [["Pared", "z1"]])).toBe(1);
  });
});

describe("Definición", () => {
  it("se registra una sola vez como partial, con catálogo y eventos", () => {
    expect(elementRegistry.obtener("etiquetar_imagen")).toBe(def);
    expect(elementRegistry.listar().filter((d) => (d as { tipo: string }).tipo === "etiquetar_imagen")).toHaveLength(1);
    expect(def.catalogo).toMatchObject({ nombre: "Etiquetar imagen", familia: "actividad" });
    expect(def.eventos).toEqual(["respuesta_correcta", "respuesta_incorrecta"]);
    expect(def.puntuacion(base(), [{ zonaId: "z1", etiquetaId: "e1" }, { zonaId: "z2", etiquetaId: "e2" }])).toBe(5);
  });
  it("lo que se crea por defecto es jugable, sin errores de validación y trae un distractor", () => {
    const a = def.crearPorDefecto();
    expect(a.tipo).toBe("etiquetar_imagen");
    expect(validarActividad(a)).toEqual([]);
    expect(a.etiquetas.length).toBeGreaterThan(a.zonas.length);
    expect(createDefaultEtiquetarImagen()).toEqual(a);
    expect(a.imagen).not.toMatch(/#/); // sin hex en el dibujo de ejemplo
  });
  it("la actividad por defecto se juega completa en el viewer", () => {
    const a = def.crearPorDefecto();
    const { onResponse } = montar(a);
    colocar("Núcleo", "zona-1");
    colocar("Citoplasma", "zona-2");
    colocar("Membrana", "zona-3");
    comprobar();
    expect(evaluateActivityResponse("etiquetar_imagen", a, onResponse.mock.calls[0]![0]).score).toBe(5);
  });
  it("las capacidades de ajustes son las que el viewer lee", () => {
    expect(CAPACIDADES_AJUSTES.etiquetar_imagen).toEqual({
      mostrarNota: true, intentos: true, tiempo: true, semilla: true, sonido: true, estilo: true,
    });
  });
  it("normalizar lleva las coordenadas a 0–1 y, para jugar, descarta marcadores sin etiqueta", () => {
    const crudo = {
      tipo: "etiquetar_imagen",
      etiquetas: [{ id: "e1", texto: "A" }],
      zonas: [
        { id: "a", x: 3, y: -1, etiquetaId: "e1" },
        { id: "b", x: 0.2, y: 0.2, etiquetaId: "nada" },
        { x: "x", etiquetaId: "e1" },
      ],
    } as never;
    const n = normalizarEtiquetarImagen(crudo);
    expect(n.zonas).toHaveLength(2);
    expect(n.zonas[0]).toEqual({ id: "a", x: 1, y: 0, etiquetaId: "e1" });
    expect(n.zonas[1]).toMatchObject({ x: 0.5, y: 0.5 });
    expect(normalizarEtiquetarImagen(crudo, false).zonas).toHaveLength(3);
    expect(normalizarEtiquetarImagen({} as never)).toMatchObject({ imagen: "", zonas: [], etiquetas: [] });
  });
});

describe("Editor y propiedades", () => {
  it("el lienzo del editor muestra la imagen y cuántos marcadores y etiquetas hay", () => {
    render(<Editor estado={base()} config={{}} onChange={() => {}} />);
    expect(screen.getByText(/2 marcadores · 3 etiquetas/)).toBeTruthy();
    expect(screen.getByAltText("Una célula")).toBeTruthy();
  });
  const montarProp = (a = base()) => {
    const onChange = vi.fn();
    render(<Propiedades estado={a} config={{}} onChange={onChange} onConfigChange={() => {}} />);
    const lienzo = screen.getByTestId("ei-lienzo");
    lienzo.getBoundingClientRect = () => ({ left: 100, top: 50, width: 200, height: 100, right: 300, bottom: 150, x: 100, y: 50, toJSON() {} });
    return { onChange, lienzo, ultimo: () => onChange.mock.calls.at(-1)![0] as EtiquetarImagenActivity };
  };
  it("clic sobre la imagen pone un marcador en fracciones y le asigna la primera etiqueta libre", () => {
    const { lienzo, ultimo } = montarProp();
    puntero(lienzo, "pointerdown", 150, 75);
    const nueva = ultimo().zonas.at(-1)!;
    expect(ultimo().zonas).toHaveLength(3);
    expect(nueva).toMatchObject({ x: 0.25, y: 0.25, etiquetaId: "e3" });
  });
  it("si no queda etiqueta libre, crea una etiqueta vacía para el marcador nuevo", () => {
    const { lienzo, ultimo } = montarProp(base({ etiquetas: base().etiquetas.slice(0, 2) }));
    puntero(lienzo, "pointerdown", 200, 100);
    expect(ultimo().etiquetas).toHaveLength(3);
    expect(ultimo().zonas.at(-1)!.etiquetaId).toBe(ultimo().etiquetas.at(-1)!.id);
  });
  it("arrastrar un marcador lo mueve (y no pone uno nuevo)", () => {
    const { ultimo, onChange } = montarProp();
    const m = screen.getByLabelText("Marcador 1");
    puntero(m, "pointerdown", 200, 100);
    puntero(m, "pointermove", 250, 125);
    puntero(m, "pointerup", 250, 125);
    expect(ultimo().zonas[0]).toMatchObject({ id: "z1", x: 0.75, y: 0.75 });
    expect(ultimo().zonas).toHaveLength(2);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
  it("las flechas mueven el marcador elegido y Supr lo quita", () => {
    const { ultimo } = montarProp();
    const m = screen.getByLabelText("Marcador 1");
    fireEvent.keyDown(m, { key: "ArrowRight" });
    expect(ultimo().zonas[0]!.x).toBeCloseTo(0.51);
    fireEvent.keyDown(m, { key: "ArrowUp", shiftKey: true });
    expect(ultimo().zonas[0]!.y).toBeCloseTo(0.45);
    fireEvent.keyDown(m, { key: "Delete" });
    expect(ultimo().zonas.map((z) => z.id)).toEqual(["z2"]);
  });
  it("las coordenadas nunca salen de 0–1", () => {
    const { ultimo } = montarProp(base({ zonas: [{ id: "z1", x: 1, y: 0, etiquetaId: "e1" }, base().zonas[1]!] }));
    fireEvent.keyDown(screen.getByLabelText("Marcador 1"), { key: "ArrowRight", shiftKey: true });
    expect(ultimo().zonas[0]!.x).toBe(1);
    fireEvent.keyDown(screen.getByLabelText("Marcador 1"), { key: "ArrowUp" });
    expect(ultimo().zonas[0]!.y).toBe(0);
  });
  it("asignar la etiqueta del marcador elegido", () => {
    const { ultimo } = montarProp();
    fireEvent.click(screen.getByLabelText("Marcador 2"));
    fireEvent.change(screen.getByLabelText("Etiqueta del marcador elegido"), { target: { value: "e3" } });
    expect(ultimo().zonas[1]!.etiquetaId).toBe("e3");
  });
  it("quitar una etiqueta deja sin asignar los marcadores que la usaban", () => {
    const { ultimo } = montarProp();
    fireEvent.click(screen.getByLabelText("Quitar etiqueta 1"));
    expect(ultimo().etiquetas.map((e) => e.id)).toEqual(["e2", "e3"]);
    expect(ultimo().zonas[0]!.etiquetaId).toBe("");
  });
  it("marca los distractores y respeta el máximo de etiquetas", () => {
    montarProp();
    expect(screen.getByText(/Distractor/)).toBeTruthy(); // «Pared» no se usa
    cleanup();
    montarProp(base({ etiquetas: Array.from({ length: 14 }, (_, i) => ({ id: `e${i}`, texto: `E${i}` })) }));
    expect((screen.getByRole("button", { name: /Agregar etiqueta/ }) as HTMLButtonElement).disabled).toBe(true);
  });
  it("editar instrucción, URL de la imagen, texto alternativo y texto de una etiqueta", () => {
    const { ultimo } = montarProp();
    fireEvent.change(screen.getByLabelText("Instrucción"), { target: { value: "Nueva" } });
    expect(ultimo().instruccion).toBe("Nueva");
    fireEvent.change(screen.getByLabelText("URL de la imagen"), { target: { value: "https://x/y.png" } });
    expect(ultimo().imagen).toBe("https://x/y.png");
    fireEvent.change(screen.getByLabelText("Texto alternativo"), { target: { value: "Otra" } });
    expect(ultimo().textoAlternativo).toBe("Otra");
    fireEvent.change(screen.getByLabelText("Etiqueta 1"), { target: { value: "Nucleolo" } });
    expect(ultimo().etiquetas[0]!.texto).toBe("Nucleolo");
  });
  it("el panel suma el panel de producción (revisión) y los ajustes comunes", () => {
    montarProp();
    expect(document.querySelector("[data-panel-produccion]")).not.toBeNull();
    expect(screen.getByText("Revisión")).toBeTruthy();
  });
});
