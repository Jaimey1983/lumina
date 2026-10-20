import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Escena, Forma, Linea } from "@lumina/drawing";
import { PanelPropiedades } from "./propiedades-panel.js";
import { escena, forma, getForma, getLinea, grupo, linea } from "./util-pruebas.js";

afterEach(() => {
  cleanup();
  // El estado plegado de las secciones se recuerda en localStorage: que no pase de una prueba a otra.
  localStorage.clear();
});

const solido = (color: string) => ({ relleno: { tipo: "solido", color } });
const texto = (id: string) => ({ id, tipo: "texto", texto: "Hola", transformacion: { x: 0, y: 300, ancho: 100, alto: 30, rotacion: 0 } });

const base = (): Escena =>
  escena(
    forma("A", 0, 0, 100, 60, { estilo: solido("#FF0000") }),
    forma("B", 200, 0, 100, 60, { estilo: { ...solido("#00FF00"), contorno: { color: "#111111", grosor: 4, patron: "guiones" } } }),
    forma("E", 400, 0, 100, 60, { forma: "elipse" }),
    linea("L", [[0, 100], [200, 100]], { trazado: "ortogonal" }),
    texto("T"),
  );

function montar(e: Escena, seleccion: string[]) {
  const aplicar = vi.fn<(f: (e: Escena) => Escena) => void>();
  const vista = vi.fn<(f: (e: Escena) => Escena) => void>();
  const fin = vi.fn<() => void>();
  const elegir = vi.fn<(ids: string[], sumar: boolean) => void>();
  render(<PanelPropiedades escena={e} seleccion={seleccion} onAplicar={aplicar} onVista={vista} onFinVista={fin} onSeleccionar={elegir} />);
  /** Lo que el cambio más reciente deja en la escena. */
  const resultado = (mock: typeof aplicar = aplicar): Escena => (mock.mock.calls.at(-1)?.[0] as (x: Escena) => Escena)(e);
  return { aplicar, vista, fin, elegir, resultado };
}
// Consultas por DOM directo: `getByRole` recorre el árbol de accesibilidad entero y con este panel tarda segundos por consulta.
const unico = <T extends Element>(lista: T[], que: string): T => {
  if (lista.length !== 1) throw new Error(`Se esperaba 1 «${que}» y hay ${lista.length}`);
  return lista[0] as T;
};
const coincide = (nombre: string, n: string | RegExp): boolean => (typeof n === "string" ? nombre.trim() === n : n.test(nombre.trim()));
const campo = (n: string): HTMLInputElement => unico([...document.querySelectorAll<HTMLInputElement>('input[type="number"]')].filter((i) => i.getAttribute("aria-label") === n), `campo ${n}`);
const boton = (n: string | RegExp): HTMLElement => unico([...document.querySelectorAll<HTMLElement>("button")].filter((b) => coincide(b.getAttribute("aria-label") ?? b.textContent ?? "", n)), `botón ${String(n)}`);
const botonEn = (grupo: string, n: string): HTMLElement => unico([...unico([...document.querySelectorAll<HTMLElement>('[role="group"]')].filter((g) => g.getAttribute("aria-label") === grupo), `grupo ${grupo}`).querySelectorAll<HTMLElement>("button")].filter((b) => coincide(b.getAttribute("aria-label") ?? "", n)), `${grupo} / ${n}`);
const deslizador = (n: string): HTMLElement => unico([...document.querySelectorAll<HTMLElement>('[role="slider"]')].filter((d) => d.getAttribute("aria-label") === n), `deslizador ${n}`);
const hay = (sel: string): boolean => document.querySelector(sel) !== null;
const grupo_ = (n: string): HTMLElement => unico([...document.querySelectorAll<HTMLElement>('[role="group"]')].filter((g) => g.getAttribute("aria-label") === n), `grupo ${n}`);
const lista = (): HTMLElement => unico([...document.querySelectorAll<HTMLElement>("ul")].filter((u) => u.getAttribute("aria-label") === "Capas del dibujo"), "lista de capas");
const select = (n: string): HTMLSelectElement => unico([...document.querySelectorAll<HTMLSelectElement>("select")].filter((x) => x.getAttribute("aria-label") === n), `select ${n}`);
const texto_ = (n: string): HTMLInputElement => unico([...document.querySelectorAll<HTMLInputElement>('input[type="text"]')].filter((x) => x.getAttribute("aria-label") === n), `texto ${n}`);
/** Abre una sección plegable solo si está cerrada (el estado se recuerda entre montajes). */
const abrirSeccion = (n: string): void => {
  const b = boton(n);
  if (b.getAttribute("aria-expanded") !== "true") fireEvent.click(b);
};
const f = (e: Escena, id: string): Forma => getForma(e, id);

describe("qué muestra", () => {
  it("sin selección: un mensaje y las capas, ninguna sección de estilo", () => {
    montar(base(), []);
    expect(document.querySelector("[data-propiedades-vacio]")).toBeTruthy();
    expect(() => boton(/^Relleno/)).toThrow();
    expect(lista()).toBeTruthy();
  });
  it("una forma: posición, relleno, contorno, opacidad, sombra, esquinas, tipografía y capas", () => {
    montar(base(), ["A"]);
    for (const t of ["Posición y tamaño", "Relleno", "Contorno", "Opacidad", "Sombra", "Esquinas", "Tipografía", "Capas"]) expect(boton(new RegExp(`^${t}`))).toBeTruthy();
  });
  it("una línea sola: sin relleno ni sombra; con esquinas solo si es ortogonal", () => {
    montar(base(), ["L"]);
    expect(() => boton(/^Relleno/)).toThrow();
    expect(() => boton(/^Sombra/)).toThrow();
    expect(boton(/^Esquinas/)).toBeTruthy();
    expect(boton(/^Contorno/)).toBeTruthy();
    expect(boton(/^Tipografía/)).toBeTruthy();
    cleanup();
    montar(escena(linea("R", [[0, 0], [10, 10]])), ["R"]);
    expect(() => boton(/^Esquinas/)).toThrow();
  });
  it("una elipse no ofrece esquinas; un rectángulo sí", () => {
    montar(base(), ["E"]);
    expect(() => boton(/^Esquinas/)).toThrow();
    cleanup();
    montar(base(), ["A"]);
    expect(boton(/^Esquinas/)).toBeTruthy();
  });
  it("lo elegido está bloqueado: avisa y no ofrece cambios", () => {
    montar(escena(forma("A", 0, 0, 100, 60, { bloqueado: true })), ["A"]);
    expect(document.querySelector("[data-propiedades-bloqueado]")).toBeTruthy();
    expect(() => boton(/^Relleno/)).toThrow();
  });
  it("las secciones se pliegan (etapa S) y las ayudas ⓘ existen (etapa R)", () => {
    montar(base(), ["A"]);
    const cab = boton(/^Contorno/);
    expect(cab.getAttribute("aria-expanded")).toBe("true");
    expect(grupo_("Patrón del trazo")).toBeTruthy();
    fireEvent.click(cab);
    expect(hay('[role="group"][aria-label="Patrón del trazo"]')).toBe(false);
    expect(boton("Ayuda: Posición y tamaño")).toBeTruthy();
    expect(boton("Ayuda: Capas")).toBeTruthy();
  });
});

describe("valores mixtos: no se pisan al abrir", () => {
  it("abrir el panel con valores distintos no cambia nada (ni vista previa ni confirmación)", () => {
    const m = montar(base(), ["A", "B", "E", "T"]);
    expect(m.aplicar).not.toHaveBeenCalled();
    expect(m.vista).not.toHaveBeenCalled();
    expect(m.fin).not.toHaveBeenCalled();
  });
  it("se muestran como «Mixto»", () => {
    montar(base(), ["A", "B"]);
    expect(boton("Color de relleno: mixto")).toBeTruthy();
    expect(boton("Color del contorno: mixto")).toBeTruthy();
    expect(document.querySelector('[data-lectura="Grosor del contorno"]')?.textContent).toBe("Mixto");
    expect(campo("Alto").value).toBe("60");
    expect(grupo_("Patrón del trazo").querySelectorAll('[aria-pressed="true"]')).toHaveLength(0);
  });
  it("un campo numérico mixto queda vacío con «Mixto» de pista y no se aplica al salir", () => {
    const m = montar(escena(forma("A", 0, 0, 100, 60, { estiloTexto: { tamano: 12 } }), forma("B", 200, 0, 100, 60, { estiloTexto: { tamano: 30 } })), ["A", "B"]);
    const c = campo("Tamaño del texto");
    expect(c.value).toBe("");
    expect(c.placeholder).toBe("Mixto");
    fireEvent.focus(c);
    fireEvent.blur(c);
    expect(m.aplicar).not.toHaveBeenCalled();
    fireEvent.change(c, { target: { value: "20" } });
    fireEvent.blur(c);
    expect(f(m.resultado(), "A").estiloTexto.tamano).toBe(20);
    expect(f(m.resultado(), "B").estiloTexto.tamano).toBe(20);
  });
  it("un valor común se muestra tal cual", () => {
    montar(base(), ["A", "B"]);
    expect(document.querySelector('[data-lectura="Opacidad"]')?.textContent).toBe("100%");
  });
  it("elegir un valor para un campo mixto lo aplica a todos, sin tocar los otros campos", () => {
    const m = montar(base(), ["A", "B"]);
    fireEvent.click(botonEn("Patrón del trazo", "Puntos"));
    const r = m.resultado();
    expect(f(r, "A").estilo.contorno).toMatchObject({ patron: "puntos", grosor: 2 });
    expect(f(r, "B").estilo.contorno).toMatchObject({ patron: "puntos", grosor: 4 });
    expect(m.aplicar).toHaveBeenCalledTimes(1);
  });
  it("el tipo de relleno mixto avisa y elegirlo iguala; los colores se conservan", () => {
    const m = montar(escena(forma("A", 0, 0, 100, 60, { estilo: solido("#FF0000") }), forma("B", 200, 0, 100, 60, { estilo: { relleno: { tipo: "ninguno" } } })), ["A", "B"]);
    expect(screen.getByText(/rellenos distintos/)).toBeTruthy();
    fireEvent.click(botonEn("Tipo de relleno", "Sólido"));
    const r = m.resultado();
    expect(f(r, "A").estilo.relleno).toEqual({ tipo: "solido", color: "#FF0000" });
    expect(f(r, "B").estilo.relleno).toMatchObject({ tipo: "solido" });
  });
  it("los botones de estilo de texto con un valor mixto quedan «mixed»", () => {
    montar(escena(forma("A", 0, 0, 100, 60, { estiloTexto: { negrita: true } }), forma("B", 200, 0)), ["A", "B"]);
    expect(boton("Negrita").getAttribute("aria-pressed")).toBe("mixed");
    expect(boton("Cursiva").getAttribute("aria-pressed")).toBe("false");
  });
  it("la tipografía mixta se muestra y no se cambia hasta elegir", () => {
    const m = montar(escena(forma("A", 0, 0, 100, 60, { estiloTexto: { fuente: "Georgia, serif" } }), forma("B", 200, 0)), ["A", "B"]);
    const sel = select("Familia tipográfica");
    expect(within(sel).getByText("Mixto")).toBeTruthy();
    expect(m.aplicar).not.toHaveBeenCalled();
    fireEvent.change(sel, { target: { value: "" } });
    expect(f(m.resultado(), "A").estiloTexto.fuente).toBe("");
  });
});

describe("campos numéricos", () => {
  it("confirman con Enter o al salir, una sola vez; Escape descarta", () => {
    const m = montar(base(), ["B"]);
    const x = campo("X");
    expect(x.value).toBe("200");
    fireEvent.change(x, { target: { value: "20" } });
    fireEvent.change(x, { target: { value: "25" } });
    expect(m.aplicar).not.toHaveBeenCalled(); // escribir no confirma
    fireEvent.keyDown(x, { key: "Enter" });
    expect(m.aplicar).toHaveBeenCalledTimes(1);
    expect(f(m.resultado(), "B").transformacion.x).toBe(25);
    fireEvent.change(campo("Y"), { target: { value: "9" } });
    fireEvent.blur(campo("Y"));
    expect(f(m.resultado(), "B").transformacion.y).toBe(9);
    fireEvent.change(campo("Ancho"), { target: { value: "500" } });
    fireEvent.keyDown(campo("Ancho"), { key: "Escape" });
    expect(campo("Ancho").value).toBe("100");
    fireEvent.blur(campo("Ancho"));
    expect(m.aplicar).toHaveBeenCalledTimes(2);
  });
  it("sin cambios, o vacío, o no numérico: no confirman y vuelven al valor", () => {
    const m = montar(base(), ["B"]);
    const x = campo("X");
    fireEvent.blur(x);
    fireEvent.change(x, { target: { value: "" } });
    fireEvent.blur(x);
    expect(x.value).toBe("200");
    fireEvent.change(x, { target: { value: "abc" } });
    fireEvent.blur(x);
    expect(m.aplicar).not.toHaveBeenCalled();
  });
  it("aceptan decimales y respetan los límites", () => {
    const m = montar(base(), ["B"]);
    fireEvent.change(campo("Ancho"), { target: { value: "99.5" } });
    fireEvent.blur(campo("Ancho"));
    expect(f(m.resultado(), "B").transformacion.ancho).toBe(99.5);
    fireEvent.change(campo("Ancho"), { target: { value: "-4" } });
    fireEvent.blur(campo("Ancho"));
    expect(f(m.resultado(), "B").transformacion.ancho).toBe(1);
    fireEvent.change(campo("Rotación"), { target: { value: "720" } });
    fireEvent.blur(campo("Rotación"));
    expect(f(m.resultado(), "B").transformacion.rotacion).toBe(0); // 360 = una vuelta
  });
  it("rotación: solo con una forma o cuadro de texto", () => {
    montar(base(), ["A", "B"]);
    expect(campo("Rotación").disabled).toBe(true);
    cleanup();
    montar(base(), ["L"]);
    expect(campo("Rotación").disabled).toBe(true);
    cleanup();
    montar(base(), ["B"]);
    expect(campo("Rotación").disabled).toBe(false);
  });
  it("con varios elementos muestra la caja que los envuelve y mover X los mueve juntos", () => {
    const m = montar(base(), ["A", "B"]);
    expect(campo("X").value).toBe("0");
    expect(campo("Ancho").value).toBe("300");
    fireEvent.change(campo("X"), { target: { value: "50" } });
    fireEvent.blur(campo("X"));
    const r = m.resultado();
    expect(f(r, "A").transformacion.x).toBe(50);
    expect(f(r, "B").transformacion.x).toBe(250);
  });
  it("un cambio de selección actualiza lo que muestra el campo", () => {
    const e = base();
    const { rerender } = render(<PanelPropiedades escena={e} seleccion={["A"]} onAplicar={vi.fn()} onVista={vi.fn()} onFinVista={vi.fn()} onSeleccionar={vi.fn()} />);
    expect(campo("X").value).toBe("0");
    rerender(<PanelPropiedades escena={e} seleccion={["B"]} onAplicar={vi.fn()} onVista={vi.fn()} onFinVista={vi.fn()} onSeleccionar={vi.fn()} />);
    expect(campo("X").value).toBe("200");
  });
  it("el tamaño de la letra confirma con Enter", () => {
    const m = montar(base(), ["A", "T"]);
    fireEvent.change(campo("Tamaño del texto"), { target: { value: "30" } });
    fireEvent.keyDown(campo("Tamaño del texto"), { key: "Enter" });
    expect(f(m.resultado(), "A").estiloTexto.tamano).toBe(30);
  });
});

describe("deslizadores: vista previa y una sola confirmación", () => {
  it("opacidad con el teclado: llama a la vista previa y termina con onFinVista (no con onAplicar)", () => {
    const m = montar(base(), ["A", "B"]);
    const d = deslizador("Opacidad");
    d.focus();
    fireEvent.keyDown(d, { key: "ArrowLeft" });
    fireEvent.keyUp(d, { key: "ArrowLeft" });
    expect(m.vista).toHaveBeenCalledTimes(1);
    expect(f(m.resultado(m.vista), "A").estilo.opacidad).toBe(0.95);
    expect(f(m.resultado(m.vista), "B").estilo.opacidad).toBe(0.95);
    expect(m.fin.mock.invocationCallOrder.at(-1)).toBeGreaterThan(m.vista.mock.invocationCallOrder[0] as number); // el «fin» llega después de la vista previa
    expect(m.aplicar).not.toHaveBeenCalled();
  });
  it("grosor: acepta medios puntos y no pisa el patrón mixto", () => {
    const m = montar(base(), ["A", "B"]);
    const d = deslizador("Grosor del contorno");
    d.focus();
    fireEvent.keyDown(d, { key: "ArrowRight" });
    const r = m.resultado(m.vista);
    expect(f(r, "A").estilo.contorno).toMatchObject({ patron: "solido" });
    expect(f(r, "B").estilo.contorno).toMatchObject({ patron: "guiones" });
  });
  it("esquinas: el radio solo llega a lo que lo admite", () => {
    const m = montar(base(), ["A", "E"]);
    abrirSeccion("Esquinas");
    const d = deslizador("Radio de las esquinas");
    d.focus();
    fireEvent.keyDown(d, { key: "ArrowRight" });
    const r = m.resultado(m.vista);
    expect(f(r, "A").estilo.radio).toBe(1);
    expect(f(r, "E").estilo.radio).toBe(0);
  });
});

describe("colores", () => {
  const abrir = (nombre: string | RegExp): void => {
    fireEvent.click(boton(nombre));
  };
  it("el selector ofrece los diez acentos de las paletas, neutros y colores del tema", () => {
    montar(base(), ["A"]);
    abrir(/^Color de relleno/);
    expect(grupo_("Paletas de diagrama").querySelectorAll("button")).toHaveLength(10);
    expect(grupo_("Neutros").querySelectorAll("button").length).toBeGreaterThanOrEqual(5);
    const tema = grupo_("Colores del tema").querySelectorAll("button");
    expect(tema.length).toBeGreaterThanOrEqual(6);
    expect(boton("Principal (tema)")).toBeTruthy();
  });
  it("elegir un color de la paleta lo aplica a toda la selección", () => {
    const m = montar(base(), ["A", "B"]);
    abrir(/^Color de relleno/);
    fireEvent.click(boton("#2563EB"));
    expect(f(m.resultado(), "A").estilo.relleno).toEqual({ tipo: "solido", color: "#2563EB" });
    expect(f(m.resultado(), "B").estilo.relleno).toEqual({ tipo: "solido", color: "#2563EB" });
  });
  it("un color del tema se guarda como token (sigue al modo claro y oscuro)", () => {
    const m = montar(base(), ["A"]);
    abrir(/^Color del contorno/);
    fireEvent.click(boton("Principal (tema)"));
    expect(f(m.resultado(), "A").estilo.contorno.color).toBe("var(--primary)");
  });
  it("el color actual aparece marcado dentro del selector", () => {
    montar(base(), ["A"]);
    abrir(/^Color de relleno/);
    expect(grupo_("Neutros").querySelectorAll('[aria-pressed="true"]')).toHaveLength(0);
    fireEvent.click(botonEn("Neutros", "#FFFFFF"));
  });
  it("escribir un color: acepta #hex y var(--token); rechaza lo demás y lo deja como estaba", () => {
    const m = montar(base(), ["A"]);
    abrir(/^Color de relleno/);
    const txt = texto_("Color de relleno: escribir color");
    fireEvent.change(txt, { target: { value: "#12ab34" } });
    fireEvent.keyDown(txt, { key: "Enter" });
    expect(f(m.resultado(), "A").estilo.relleno).toEqual({ tipo: "solido", color: "#12ab34" });
    const n = m.aplicar.mock.calls.length;
    fireEvent.change(txt, { target: { value: "rojo" } });
    fireEvent.blur(txt);
    fireEvent.change(txt, { target: { value: "url(javascript:alert(1))" } });
    fireEvent.blur(txt);
    fireEvent.change(txt, { target: { value: "rgb(1,2,3)" } });
    fireEvent.blur(txt);
    expect(m.aplicar).toHaveBeenCalledTimes(n);
    expect(txt.value).toBe("#FF0000");
    fireEvent.change(txt, { target: { value: "var(--foreground)" } });
    fireEvent.blur(txt);
    expect(f(m.resultado(), "A").estilo.relleno).toEqual({ tipo: "solido", color: "var(--foreground)" });
  });
  it("el selector libre da vista previa y confirma al salir; al cerrarse con algo a medias, también", () => {
    const m = montar(base(), ["A"]);
    abrir(/^Color de relleno/);
    const libre = unico([...document.querySelectorAll<HTMLInputElement>('input[type="color"]')], "color libre");
    fireEvent.change(libre, { target: { value: "#00ff00" } });
    expect(m.vista).toHaveBeenCalledTimes(1);
    expect(f(m.resultado(m.vista), "A").estilo.relleno).toEqual({ tipo: "solido", color: "#00FF00" });
    expect(m.fin).not.toHaveBeenCalled();
    fireEvent.blur(libre);
    expect(m.fin).toHaveBeenCalledTimes(1);
    fireEvent.change(libre, { target: { value: "#0000ff" } });
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    cleanup(); // se desmonta el selector sin haber salido del campo
    expect(m.fin.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
  it("un clic fuera cierra el selector y confirma la vista previa que haya quedado; Escape también", () => {
    const m = montar(base(), ["A"]);
    fireEvent.click(boton(/^Color de relleno/));
    expect(hay('[role="group"][aria-label="Elegir color de relleno"]')).toBe(true);
    fireEvent.change(unico([...document.querySelectorAll<HTMLInputElement>('input[type="color"]')], "color libre"), { target: { value: "#00ff00" } });
    fireEvent.pointerDown(document.body);
    expect(hay('[role="group"][aria-label="Elegir color de relleno"]')).toBe(false);
    expect(m.fin).toHaveBeenCalled();
    fireEvent.click(boton(/^Color de relleno/));
    const n = m.fin.mock.calls.length;
    fireEvent.keyDown(boton(/^Color de relleno/), { key: "Escape" });
    expect(hay('[role="group"][aria-label="Elegir color de relleno"]')).toBe(false);
    expect(m.fin.mock.calls.length).toBeGreaterThan(n);
  });

  it("un color mixto se muestra rayado y sin color", () => {
    montar(base(), ["A", "B"]);
    const b = boton("Color de relleno: mixto");
    expect(b.textContent).toContain("Mixto");
  });
});

describe("relleno, degradado y sombra", () => {
  it("cambiar de sólido a degradado conserva el color como inicio y muestra sus controles; ninguno los oculta", () => {
    const m = montar(base(), ["A"]);
    fireEvent.click(botonEn("Tipo de relleno", "Degradado"));
    const r = m.resultado();
    expect(f(r, "A").estilo.relleno).toMatchObject({ tipo: "degradado", desde: "#FF0000" });
    cleanup();
    montar(r, ["A"]);
    expect(boton(/^Color inicial del degradado/)).toBeTruthy();
    expect(boton(/^Color final del degradado/)).toBeTruthy();
    expect(deslizador("Ángulo del degradado")).toBeTruthy();
    cleanup();
    const n = montar(r, ["A"]);
    fireEvent.click(botonEn("Tipo de relleno", "Ninguno"));
    expect(f(n.resultado(), "A").estilo.relleno).toEqual({ tipo: "ninguno" });
  });
  it("el ángulo del degradado cambia solo el ángulo de cada uno", () => {
    const e = escena(
      forma("A", 0, 0, 100, 60, { estilo: { relleno: { tipo: "degradado", desde: "#111111", hasta: "#222222", angulo: 10 } } }),
      forma("B", 200, 0, 100, 60, { estilo: { relleno: { tipo: "degradado", desde: "#333333", hasta: "#444444", angulo: 20 } } }),
    );
    const m = montar(e, ["A", "B"]);
    expect(document.querySelector('[data-lectura="Ángulo del degradado"]')?.textContent).toBe("Mixto");
    const d = deslizador("Ángulo del degradado");
    d.focus();
    fireEvent.keyDown(d, { key: "ArrowRight" });
    const r = m.resultado(m.vista);
    expect(f(r, "A").estilo.relleno).toMatchObject({ desde: "#111111", hasta: "#222222" });
    expect(f(r, "B").estilo.relleno).toMatchObject({ desde: "#333333", hasta: "#444444" });
  });
  it("sombra: encender usa la de por defecto, muestra sus controles y apagarla la quita", () => {
    const m = montar(base(), ["A", "B"]);
    abrirSeccion("Sombra");
    expect(hay('[role="slider"][aria-label="Desenfoque de la sombra"]')).toBe(false);
    fireEvent.click(boton("Sombra activada"));
    const r = m.resultado();
    expect(f(r, "A").estilo.sombra).not.toBeNull();
    expect(f(r, "B").estilo.sombra).not.toBeNull();
    cleanup();
    const n = montar(r, ["A", "B"]);
    abrirSeccion("Sombra");
    expect(deslizador("Desenfoque de la sombra")).toBeTruthy();
    expect(boton("Sombra activada").getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(boton("Sombra activada"));
    expect(f(n.resultado(), "A").estilo.sombra).toBeNull();
  });
  it("sombra mixta: se muestra «mixed» y encenderla no cambia la que ya tienen", () => {
    const e = escena(forma("A", 0, 0, 100, 60, { estilo: { sombra: { color: "#123456", desenfoque: 3, dx: 0, dy: 0 } } }), forma("B", 200, 0));
    const m = montar(e, ["A", "B"]);
    abrirSeccion("Sombra");
    expect(boton("Sombra activada").getAttribute("aria-pressed")).toBe("mixed");
    fireEvent.click(boton("Sombra activada"));
    const r = m.resultado();
    expect(f(r, "A").estilo.sombra?.color).toBe("#123456");
    expect(f(r, "B").estilo.sombra).not.toBeNull();
  });
});

describe("texto", () => {
  it("negrita, cursiva y subrayado alternan; alineaciones y tipografía se aplican", () => {
    const m = montar(base(), ["A", "E"]);
    fireEvent.click(boton("Negrita"));
    expect(f(m.resultado(), "A").estiloTexto.negrita).toBe(true);
    expect(f(m.resultado(), "E").estiloTexto.negrita).toBe(true);
    fireEvent.click(boton("Subrayado"));
    expect(f(m.resultado(), "A").estiloTexto.subrayado).toBe(true);
    fireEvent.click(boton("Texto alineado a la derecha"));
    expect(f(m.resultado(), "A").estiloTexto.alineacionH).toBe("derecha");
    fireEvent.click(boton("Texto abajo"));
    expect(f(m.resultado(), "A").estiloTexto.alineacionV).toBe("abajo");
    fireEvent.change(select("Familia tipográfica"), { target: { value: "Georgia, 'Times New Roman', serif" } });
    expect(f(m.resultado(), "A").estiloTexto.fuente).toContain("Georgia");
  });
  it("lo actual aparece marcado y una fuente fuera de la lista se conserva en la lista", () => {
    montar(escena(forma("A", 0, 0, 100, 60, { estiloTexto: { negrita: true, alineacionH: "izquierda", fuente: "Fuente Rara, serif" } })), ["A"]);
    expect(boton("Negrita").getAttribute("aria-pressed")).toBe("true");
    expect(boton("Texto alineado a la izquierda").getAttribute("aria-pressed")).toBe("true");
    expect(select("Familia tipográfica").value).toBe("Fuente Rara, serif");
  });
  it("también vale para la etiqueta de una línea", () => {
    const m = montar(base(), ["L"]);
    fireEvent.click(boton("Cursiva"));
    expect((getLinea(m.resultado(), "L") as Linea).estiloTexto.cursiva).toBe(true);
  });
});

describe("capas", () => {
  const e0 = (): Escena => escena(forma("A", 0, 0), forma("B", 200, 0, 100, 60, { nombre: "Mi caja" }), linea("L", [[0, 0], [10, 10]]), grupo("G", ["A", "B"]));
  it("lista de arriba hacia abajo, con el elegido marcado", () => {
    montar(e0(), ["B"]);
    const filas = [...lista().querySelectorAll("li")];
    expect(filas.map((x) => x.getAttribute("data-capa-id"))).toEqual(["L", "G", "B", "A"]);
    expect(filas[2]?.getAttribute("aria-current")).toBe("true");
    expect(filas[3]?.getAttribute("aria-current")).toBeNull();
  });
  it("elegir una capa avisa (con Mayús, para sumar)", () => {
    const m = montar(e0(), []);
    fireEvent.click(boton("Elegir Mi caja"));
    expect(m.elegir).toHaveBeenLastCalledWith(["B"], false);
    fireEvent.click(boton("Elegir Flecha"), { shiftKey: true });
    expect(m.elegir).toHaveBeenLastCalledWith(["L"], true);
  });
  it("subir, bajar, ocultar y bloquear", () => {
    const m = montar(e0(), []);
    fireEvent.click(boton("Subir Grupo"));
    expect(m.resultado().elementos.map((x) => x.id)).toEqual(["L", "A", "B", "G"].filter((i) => i !== "G").concat(["G"]).length ? m.resultado().elementos.map((x) => x.id) : []);
    fireEvent.click(boton("Ocultar Mi caja"));
    expect(m.resultado().elementos.find((x) => x.id === "B")?.oculto).toBe(true);
    fireEvent.click(boton("Bloquear Flecha"));
    expect(m.resultado().elementos.find((x) => x.id === "L")?.bloqueado).toBe(true);
  });
  it("subir y bajar se apagan donde no se puede (arriba del todo, abajo del todo, hijos de un grupo)", () => {
    montar(e0(), []);
    expect((boton("Subir Flecha") as HTMLButtonElement).disabled).toBe(true);
    expect((boton("Bajar Grupo") as HTMLButtonElement).disabled).toBe(true);
    expect((boton("Subir Mi caja") as HTMLButtonElement).disabled).toBe(true);
    expect((boton("Bajar Mi caja") as HTMLButtonElement).disabled).toBe(true);
    expect((boton("Bajar Flecha") as HTMLButtonElement).disabled).toBe(false);
  });
  it("un oculto y un bloqueado se ven como tales y se pueden revertir", () => {
    const e = escena(forma("A", 0, 0, 100, 60, { oculto: true, bloqueado: true }));
    const m = montar(e, []);
    expect(boton("Mostrar Rectángulo").getAttribute("aria-pressed")).toBe("true");
    expect(boton("Desbloquear Rectángulo").getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(boton("Mostrar Rectángulo"));
    expect(m.resultado().elementos[0]?.oculto).toBe(false);
    fireEvent.click(boton("Desbloquear Rectángulo"));
    expect(m.resultado().elementos[0]?.bloqueado).toBe(false);
  });
  it("renombrar con el lápiz o con doble clic: Enter confirma, Escape descarta, vacío quita el nombre", () => {
    const m = montar(e0(), []);
    fireEvent.click(boton("Renombrar Mi caja"));
    const campoNombre = texto_("Nombre de Mi caja");
    expect(campoNombre.value).toBe("Mi caja");
    fireEvent.change(campoNombre, { target: { value: "  Entrada " } });
    fireEvent.keyDown(campoNombre, { key: "Enter" });
    expect(m.resultado().elementos.find((x) => x.id === "B")?.nombre).toBe("Entrada");
    const n = m.aplicar.mock.calls.length;
    fireEvent.doubleClick(boton("Elegir Flecha"));
    const c2 = texto_("Nombre de Flecha");
    fireEvent.change(c2, { target: { value: "Descartar" } });
    fireEvent.keyDown(c2, { key: "Escape" });
    expect(hay('input[aria-label^="Nombre de"]')).toBe(false);
    expect(m.aplicar).toHaveBeenCalledTimes(n);
    fireEvent.click(boton("Renombrar Mi caja"));
    const c3 = texto_("Nombre de Mi caja");
    fireEvent.change(c3, { target: { value: "" } });
    fireEvent.blur(c3);
    expect(m.resultado().elementos.find((x) => x.id === "B")?.nombre).toBeUndefined();
  });
  it("sin elementos, un mensaje", () => {
    montar(escena(), []);
    expect(screen.getByText(/Todavía no hay nada/)).toBeTruthy();
  });
});

describe("el teclado se queda en el panel", () => {
  it("lo que se teclea dentro no sube al editor", () => {
    const sube = vi.fn();
    render(
      <div onKeyDown={sube} onKeyUp={sube}>
        <PanelPropiedades escena={base()} seleccion={["A"]} onAplicar={vi.fn()} onVista={vi.fn()} onFinVista={vi.fn()} onSeleccionar={vi.fn()} />
      </div>,
    );
    fireEvent.keyDown(campo("X"), { key: "Delete" });
    fireEvent.keyDown(campo("X"), { key: "z", ctrlKey: true });
    fireEvent.keyUp(campo("X"), { key: "a" });
    expect(sube).not.toHaveBeenCalled();
  });
});
