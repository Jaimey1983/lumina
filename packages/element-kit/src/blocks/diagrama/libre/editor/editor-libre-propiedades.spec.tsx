import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Escena, Forma, Linea } from "@lumina/drawing";
import { EditorLibre } from "./editor-libre.js";
import { escena, forma, getForma, linea } from "./util-pruebas.js";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

interface Montado {
  onCambio: ReturnType<typeof vi.fn<(e: Escena) => void>>;
  onCerrar: ReturnType<typeof vi.fn<(e: Escena) => void>>;
  lienzo: SVGSVGElement;
  aPantalla: (x: number, y: number) => { clientX: number; clientY: number };
  ultima: () => Escena;
}

function montar(e: Escena): Montado {
  const onCambio = vi.fn<(e: Escena) => void>();
  const onCerrar = vi.fn<(e: Escena) => void>();
  render(<EditorLibre escena={e} titulo="Prueba" onCambio={onCambio} onCerrar={onCerrar} />);
  const lienzo = screen.getByRole("application", { name: "Lienzo de dibujo" }) as unknown as SVGSVGElement;
  const vista = () => {
    const g = document.querySelector("[data-dibujo-pagina]")?.parentElement?.getAttribute("transform") ?? "";
    const m = /translate\(([-\d.e]+) ([-\d.e]+)\) scale\(([-\d.e]+)\)/.exec(g);
    return { x: Number(m?.[1]), y: Number(m?.[2]), z: Number(m?.[3]) };
  };
  return {
    onCambio,
    onCerrar,
    lienzo,
    aPantalla: (x, y) => {
      const v = vista();
      return { clientX: v.x + x * v.z, clientY: v.y + y * v.z };
    },
    ultima: () => onCambio.mock.calls.at(-1)?.[0] as Escena,
  };
}

type P = { clientX: number; clientY: number };
const puntero = (el: Element, tipo: "pointerdown" | "pointermove" | "pointerup", p: P, extra: MouseEventInit = {}): void => {
  fireEvent(el, new MouseEvent(tipo, { bubbles: true, cancelable: true, button: 0, ...p, ...extra }));
};
const clic = (m: Montado, x: number, y: number, extra: MouseEventInit = {}): void => {
  puntero(m.lienzo, "pointerdown", m.aPantalla(x, y), extra);
  puntero(m.lienzo, "pointerup", m.aPantalla(x, y), extra);
};
function arrastrar(m: Montado, desde: [number, number], hasta: [number, number], pasos = 6): void {
  puntero(m.lienzo, "pointerdown", m.aPantalla(...desde));
  for (let i = 1; i <= pasos; i++) puntero(m.lienzo, "pointermove", m.aPantalla(desde[0] + ((hasta[0] - desde[0]) * i) / pasos, desde[1] + ((hasta[1] - desde[1]) * i) / pasos));
  puntero(m.lienzo, "pointerup", m.aPantalla(...hasta));
}

// Consultas por DOM directo (con este panel `getByRole` tarda segundos).
const un = <T extends Element>(l: T[], q: string): T => {
  if (l.length !== 1) throw new Error(`Se esperaba 1 «${q}» y hay ${l.length}`);
  return l[0] as T;
};
const boton = (n: string | RegExp): HTMLElement => un([...document.querySelectorAll<HTMLElement>("button")].filter((b) => { const x = (b.getAttribute("aria-label") ?? b.textContent ?? "").trim(); return typeof n === "string" ? x === n : n.test(x); }), `botón ${String(n)}`);
const campo = (n: string): HTMLInputElement => un([...document.querySelectorAll<HTMLInputElement>('input[type="number"]')].filter((i) => i.getAttribute("aria-label") === n), `campo ${n}`);
const deslizador = (n: string): HTMLElement => un([...document.querySelectorAll<HTMLElement>('[role="slider"]')].filter((d) => d.getAttribute("aria-label") === n), `deslizador ${n}`);
const colorLibre = (): HTMLInputElement => un([...document.querySelectorAll<HTMLInputElement>('input[type="color"]')], "color libre");
const forma_ = (id: string): Element | null => document.querySelector(`[data-elemento-id="${id}"]`);
const relleno = (id: string): string | null | undefined => forma_(id)?.querySelector("path")?.getAttribute("fill");
const estado = (): string => document.querySelector("[data-dibujo-estado]")?.textContent ?? "";
const deshacer = (m: Montado): void => void fireEvent.keyDown(m.lienzo, { key: "z", ctrlKey: true });
const f = (e: Escena, id: string): Forma => getForma(e, id);

const solido = (color: string) => ({ relleno: { tipo: "solido", color } });
const base = (): Escena =>
  escena(
    forma("A", 100, 100, 100, 60, { nombre: "Caja A", estilo: solido("#FF0000") }),
    forma("B", 300, 100, 100, 60, { nombre: "Caja B", estilo: { ...solido("#00FF00"), contorno: { color: "#111111", grosor: 4, patron: "guiones" } } }),
    linea("L", [[200, 130], [300, 130]], { origen: { elementoId: "A", puerto: 1 }, destino: { elementoId: "B", puerto: 3 } }),
  );

describe("el panel dentro del editor", () => {
  it("está a la derecha, siempre visible, y sin selección invita a elegir algo", () => {
    montar(base());
    expect(document.querySelector("[data-dibujo-propiedades]")).toBeTruthy();
    expect(document.querySelector("[data-propiedades-vacio]")).toBeTruthy();
  });

  it("al elegir una forma muestra sus valores; al elegir dos con valores distintos los muestra como mixtos y NO cambia nada", () => {
    const m = montar(base());
    clic(m, 150, 130);
    expect(campo("X").value).toBe("100");
    expect(boton("Color de relleno: #FF0000")).toBeTruthy();
    clic(m, 350, 130, { shiftKey: true });
    expect(estado()).toContain("2 seleccionados");
    expect(boton("Color de relleno: mixto")).toBeTruthy();
    expect(m.onCambio).not.toHaveBeenCalled();
  });
});

describe("cambiar el estilo", () => {
  it("un color de la paleta se aplica a todos los elegidos, es UNA entrada y se deshace de una vez", () => {
    const m = montar(base());
    clic(m, 150, 130);
    clic(m, 350, 130, { shiftKey: true });
    fireEvent.click(boton("Color de relleno: mixto"));
    fireEvent.click(boton("#2563EB"));
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    expect(f(m.ultima(), "A").estilo.relleno).toEqual({ tipo: "solido", color: "#2563EB" });
    expect(f(m.ultima(), "B").estilo.relleno).toEqual({ tipo: "solido", color: "#2563EB" });
    expect(relleno("A")).toBe("#2563EB");
    // lo que no se tocó sigue mixto: el grosor de B
    expect(f(m.ultima(), "B").estilo.contorno.grosor).toBe(4);
    deshacer(m);
    expect(f(m.ultima(), "A").estilo.relleno).toEqual({ tipo: "solido", color: "#FF0000" });
    expect(f(m.ultima(), "B").estilo.relleno).toEqual({ tipo: "solido", color: "#00FF00" });
    expect(relleno("B")).toBe("#00FF00");
  });

  it("el selector libre da vista previa en el dibujo sin avisar al bloque, y confirma UNA vez al salir", () => {
    const m = montar(base());
    clic(m, 150, 130);
    fireEvent.click(boton("Color de relleno: #FF0000"));
    for (const c of ["#111111", "#222222", "#333333"]) fireEvent.change(colorLibre(), { target: { value: c } });
    expect(relleno("A")).toBe("#333333"); // se ve ya
    expect(m.onCambio).not.toHaveBeenCalled(); // pero el bloque no se entera todavía
    fireEvent.blur(colorLibre());
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    expect(f(m.ultima(), "A").estilo.relleno).toEqual({ tipo: "solido", color: "#333333" });
    deshacer(m);
    expect(relleno("A")).toBe("#FF0000"); // una sola entrada: un deshacer vuelve al color de antes de arrastrar
  });

  it("cerrar el selector con una vista previa a medias la confirma; hacer clic en el lienzo también", () => {
    const m = montar(base());
    clic(m, 150, 130);
    fireEvent.click(boton("Color de relleno: #FF0000"));
    fireEvent.change(colorLibre(), { target: { value: "#444444" } });
    expect(m.onCambio).not.toHaveBeenCalled();
    clic(m, 600, 400); // clic en el vacío del lienzo
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    expect(f(m.ultima(), "A").estilo.relleno).toEqual({ tipo: "solido", color: "#444444" });
  });

  it("deshacer con una vista previa pendiente la confirma primero y deshace solo esa", () => {
    const m = montar(base());
    clic(m, 150, 130);
    fireEvent.click(boton("Negrita"));
    fireEvent.click(boton("Color de relleno: #FF0000"));
    fireEvent.change(colorLibre(), { target: { value: "#666666" } });
    deshacer(m);
    expect(f(m.ultima(), "A").estilo.relleno).toEqual({ tipo: "solido", color: "#FF0000" });
    expect(f(m.ultima(), "A").estiloTexto.negrita).toBe(true); // la negrita anterior sigue
    expect(relleno("A")).toBe("#FF0000");
  });

  it("hacer otro cambio con una vista previa a medias: primero entra la vista previa y luego el cambio, en ese orden", () => {
    const m = montar(base());
    clic(m, 150, 130);
    fireEvent.click(boton("Color de relleno: #FF0000"));
    fireEvent.change(colorLibre(), { target: { value: "#777777" } });
    fireEvent.click(boton("Negrita")); // sin que el ratón «salga» del selector (en pruebas no hay pointerdown)
    expect(m.onCambio).toHaveBeenCalledTimes(2);
    expect(f(m.onCambio.mock.calls[0]?.[0] as Escena, "A").estilo.relleno).toEqual({ tipo: "solido", color: "#777777" });
    expect(f(m.onCambio.mock.calls[0]?.[0] as Escena, "A").estiloTexto.negrita).toBe(false);
    expect(f(m.ultima(), "A").estiloTexto.negrita).toBe(true);
    deshacer(m);
    expect(f(m.ultima(), "A").estiloTexto.negrita).toBe(false);
    expect(f(m.ultima(), "A").estilo.relleno).toEqual({ tipo: "solido", color: "#777777" });
    deshacer(m);
    expect(f(m.ultima(), "A").estilo.relleno).toEqual({ tipo: "solido", color: "#FF0000" });
  });

  it("«Listo» con una vista previa pendiente devuelve la escena con ese cambio", () => {
    const m = montar(base());
    clic(m, 150, 130);
    fireEvent.click(boton("Color de relleno: #FF0000"));
    fireEvent.change(colorLibre(), { target: { value: "#555555" } });
    fireEvent.click(un([...document.querySelectorAll<HTMLElement>("[data-dibujo-listo]")], "Listo"));
    const final = m.onCerrar.mock.calls.at(-1)?.[0] as Escena;
    expect(f(final, "A").estilo.relleno).toEqual({ tipo: "solido", color: "#555555" });
    expect(m.onCambio).toHaveBeenCalledTimes(1);
  });

  it("deslizador de opacidad con el teclado: se ve al instante y entra como UNA entrada al soltar la tecla", () => {
    const m = montar(base());
    clic(m, 150, 130);
    const d = deslizador("Opacidad");
    d.focus();
    fireEvent.keyDown(d, { key: "ArrowLeft" });
    expect(m.onCambio).not.toHaveBeenCalled(); // mientras la tecla está apretada solo hay vista previa
    expect(forma_("A")?.getAttribute("opacity")).toBe("0.95");
    fireEvent.keyUp(d, { key: "ArrowLeft" });
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    expect(f(m.ultima(), "A").estilo.opacidad).toBe(0.95);
    expect(forma_("A")?.getAttribute("opacity")).toBe("0.95");
    deshacer(m);
    expect(forma_("A")?.getAttribute("opacity")).toBeNull();
  });

  it("negrita y esquinas: cada cambio es una entrada", () => {
    const m = montar(base());
    clic(m, 150, 130);
    fireEvent.click(boton("Negrita"));
    expect(f(m.ultima(), "A").estiloTexto.negrita).toBe(true);
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    fireEvent.click(boton("Subrayado"));
    expect(m.onCambio).toHaveBeenCalledTimes(2);
    deshacer(m);
    expect(f(m.ultima(), "A").estiloTexto.subrayado).toBe(false);
    expect(f(m.ultima(), "A").estiloTexto.negrita).toBe(true);
  });

  it("elegir una línea ofrece contorno y trazo, y cambiarlos se ve en el dibujo", () => {
    const m = montar(base());
    clic(m, 250, 130);
    expect(estado()).toContain("1 seleccionado");
    fireEvent.click(un([...document.querySelectorAll<HTMLElement>('[role="group"][aria-label="Patrón del trazo"] button')].filter((b) => b.getAttribute("aria-label") === "Puntos"), "Puntos"));
    expect((m.ultima().elementos.find((x) => x.id === "L") as Linea).estilo.contorno.patron).toBe("puntos");
    expect(forma_("L")?.querySelector("path")?.getAttribute("stroke-dasharray")).toMatch(/^0\.01/);
  });
});

describe("posición y tamaño", () => {
  it("escribir X mueve la forma y el conector pegado la sigue", () => {
    const m = montar(base());
    clic(m, 150, 130);
    fireEvent.change(campo("X"), { target: { value: "20" } });
    fireEvent.keyDown(campo("X"), { key: "Enter" });
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    expect(f(m.ultima(), "A").transformacion.x).toBe(20);
    const l = m.ultima().elementos.find((x) => x.id === "L") as Linea;
    expect(l.origen).toEqual({ elementoId: "A", puerto: 1 });
    expect(l.puntos[0]).toEqual({ x: 120, y: 130 });
  });

  it("al arrastrar la forma por el lienzo, los campos se actualizan", () => {
    const m = montar(base());
    clic(m, 150, 130);
    arrastrar(m, [150, 130], [250, 230]);
    expect(Number(campo("X").value)).toBeGreaterThan(150);
    expect(Number(campo("Y").value)).toBeGreaterThan(180);
  });

  it("girar con el campo de rotación", () => {
    const m = montar(base());
    clic(m, 150, 130);
    fireEvent.change(campo("Rotación"), { target: { value: "45" } });
    fireEvent.blur(campo("Rotación"));
    expect(f(m.ultima(), "A").transformacion.rotacion).toBe(45);
  });

  it("con varias formas, el ancho las escala juntas por su caja", () => {
    const m = montar(base());
    arrastrar(m, [60, 60], [450, 220]); // elige todo
    expect(campo("Ancho").value).toBe("300");
    fireEvent.change(campo("Ancho"), { target: { value: "600" } });
    fireEvent.blur(campo("Ancho"));
    expect(f(m.ultima(), "A").transformacion.ancho).toBeCloseTo(200, 1);
    expect(f(m.ultima(), "B").transformacion.x).toBeCloseTo(500, 1);
  });
});

describe("capas", () => {
  const filas = (): string[] => [...document.querySelectorAll("[data-capa-id]")].map((x) => x.getAttribute("data-capa-id") ?? "");

  it("lista lo que hay, con lo último dibujado arriba", () => {
    montar(base());
    expect(filas()).toEqual(["L", "B", "A"]);
  });

  it("ocultar saca el elemento del dibujo (sin borrarlo) y mostrar lo devuelve; cada uno es una entrada", () => {
    const m = montar(base());
    fireEvent.click(boton("Ocultar Caja A"));
    expect(forma_("A")).toBeNull();
    expect(m.ultima().elementos.find((x) => x.id === "A")?.oculto).toBe(true);
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    fireEvent.click(boton("Mostrar Caja A"));
    expect(forma_("A")).not.toBeNull();
    deshacer(m);
    expect(forma_("A")).toBeNull();
  });

  it("elegir una capa elige el elemento aunque esté oculto, y el panel muestra sus valores", () => {
    const m = montar(base());
    fireEvent.click(boton("Ocultar Caja A"));
    fireEvent.click(boton("Elegir Caja A"));
    expect(estado()).toContain("1 seleccionado");
    expect(campo("X").value).toBe("100");
    expect(boton("Color de relleno: #FF0000")).toBeTruthy();
    expect(m.onCambio).toHaveBeenCalledTimes(1); // solo lo de ocultar
  });

  it("Mayús al elegir capas suma a la selección", () => {
    montar(base());
    fireEvent.click(boton("Elegir Caja A"));
    fireEvent.click(boton("Elegir Caja B"), { shiftKey: true });
    expect(estado()).toContain("2 seleccionados");
    fireEvent.click(boton("Elegir Caja B"), { shiftKey: true });
    expect(estado()).toContain("1 seleccionado");
  });

  it("bloquear: la forma no se puede mover con el ratón ni cambiar desde el panel, y desbloquear lo permite", () => {
    const m = montar(base());
    fireEvent.click(boton("Bloquear Caja A"));
    expect(m.ultima().elementos.find((x) => x.id === "A")?.bloqueado).toBe(true);
    const n = m.onCambio.mock.calls.length;
    arrastrar(m, [150, 130], [150, 300]);
    expect(m.onCambio).toHaveBeenCalledTimes(n);
    fireEvent.click(boton("Elegir Caja A"));
    expect(document.querySelector("[data-propiedades-bloqueado]")).toBeTruthy();
    fireEvent.click(boton("Desbloquear Caja A"));
    expect(document.querySelector("[data-propiedades-bloqueado]")).toBeNull();
    arrastrar(m, [150, 130], [150, 300]);
    expect(f(m.ultima(), "A").transformacion.y).toBeGreaterThan(200);
  });

  it("subir y bajar cambian cuál se dibuja encima", () => {
    const m = montar(base());
    const orden = (): string[] => [...document.querySelectorAll("[data-elemento-id]")].map((x) => x.getAttribute("data-elemento-id") ?? "");
    expect(orden()).toEqual(["A", "B", "L"]);
    fireEvent.click(boton("Subir Caja A"));
    expect(orden()).toEqual(["B", "A", "L"]);
    expect(filas()).toEqual(["L", "A", "B"]);
    fireEvent.click(boton("Bajar Caja A"));
    expect(orden()).toEqual(["A", "B", "L"]);
    expect(m.onCambio).toHaveBeenCalledTimes(2);
  });

  it("renombrar cambia el nombre en la lista y en el modelo (y lo oye el lector de pantalla)", () => {
    const m = montar(base());
    fireEvent.click(boton("Renombrar Caja B"));
    const c = un([...document.querySelectorAll<HTMLInputElement>('input[aria-label="Nombre de Caja B"]')], "campo de nombre");
    fireEvent.change(c, { target: { value: "Salida" } });
    fireEvent.keyDown(c, { key: "Enter" });
    expect(m.ultima().elementos.find((x) => x.id === "B")?.nombre).toBe("Salida");
    expect(boton("Elegir Salida")).toBeTruthy();
    expect(forma_("B")?.querySelector("title")?.textContent).toBe("Salida");
  });
});

describe("el teclado del panel no toca el editor", () => {
  it("Supr y Ctrl+Z dentro de un campo no borran ni deshacen nada del dibujo", () => {
    const m = montar(base());
    clic(m, 150, 130);
    fireEvent.click(boton("Negrita"));
    const n = m.onCambio.mock.calls.length;
    fireEvent.keyDown(campo("X"), { key: "Delete" });
    fireEvent.keyDown(campo("X"), { key: "z", ctrlKey: true });
    fireEvent.keyDown(campo("X"), { key: "Escape" });
    expect(m.onCambio).toHaveBeenCalledTimes(n);
    expect(forma_("A")).not.toBeNull();
    expect(m.onCerrar).not.toHaveBeenCalled();
  });

  it("lo que se teclea en el panel no llega a la ventana (el editor de diapositivas)", () => {
    const enVentana = vi.fn();
    window.addEventListener("keydown", enVentana);
    const m = montar(base());
    clic(m, 150, 130);
    fireEvent.keyDown(campo("X"), { key: "Delete" });
    window.removeEventListener("keydown", enVentana);
    expect(enVentana).not.toHaveBeenCalled();
  });

  it("después de usar el panel, las flechas del lienzo siguen moviendo la selección", () => {
    const m = montar(base());
    clic(m, 150, 130);
    fireEvent.click(boton("Negrita"));
    m.lienzo.focus();
    fireEvent.keyDown(m.lienzo, { key: "ArrowRight", shiftKey: true });
    expect(f(m.ultima(), "A").transformacion.x).toBe(110);
  });
});

describe("coherencia", () => {
  it("lo que sale del editor tras usar el panel sigue siendo una escena válida y con los conectores al día", () => {
    const m = montar(base());
    clic(m, 150, 130);
    fireEvent.click(boton("Color de relleno: #FF0000"));
    fireEvent.click(boton("#2563EB"));
    fireEvent.change(campo("Ancho"), { target: { value: "250" } });
    fireEvent.blur(campo("Ancho"));
    expect(m.onCambio.mock.calls.length).toBeGreaterThanOrEqual(2);
    const l = m.ultima().elementos.find((x) => x.id === "L") as Linea;
    expect(l.puntos[0]).toEqual({ x: 350, y: 130 }); // el puerto de la derecha de A, que ahora está en x = 100 + 250
  });
});

describe("deslizadores", () => {
  it("mantener apretada una flecha da varios pasos de vista previa y UNA sola entrada de historial", () => {
    const m = montar(base());
    clic(m, 150, 130);
    const d = deslizador("Opacidad");
    d.focus();
    for (let i = 0; i < 4; i++) fireEvent.keyDown(d, { key: "ArrowLeft" });
    expect(m.onCambio).not.toHaveBeenCalled();
    expect(forma_("A")?.getAttribute("opacity")).toBe("0.8");
    fireEvent.keyUp(d, { key: "ArrowLeft" });
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    expect(f(m.ultima(), "A").estilo.opacidad).toBe(0.8);
    deshacer(m);
    expect(forma_("A")?.getAttribute("opacity")).toBeNull(); // un solo deshacer vuelve al principio
  });

  it("soltar la tecla sin haber cambiado nada no agrega nada al historial", () => {
    const m = montar(base());
    clic(m, 150, 130);
    const d = deslizador("Opacidad");
    d.focus();
    fireEvent.keyUp(d, { key: "ArrowLeft" });
    expect(m.onCambio).not.toHaveBeenCalled();
  });
});

describe("descripción para lectores de pantalla en el editor", () => {
  const campoDescripcion = (): HTMLTextAreaElement => un([...document.querySelectorAll<HTMLTextAreaElement>("textarea")].filter((t) => t.getAttribute("aria-label") === "Descripción para lectores de pantalla"), "descripción");

  it("escribirla y salir del campo es UNA entrada, se ve como <title> del elemento y se deshace", () => {
    const m = montar(base());
    clic(m, 150, 130);
    fireEvent.change(campoDescripcion(), { target: { value: "Caja roja de inicio" } });
    expect(m.onCambio).not.toHaveBeenCalled();
    fireEvent.blur(campoDescripcion());
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    expect(m.ultima().elementos.find((x) => x.id === "A")?.descripcion).toBe("Caja roja de inicio");
    expect(forma_("A")?.querySelector("title")?.textContent).toBe("Caja roja de inicio");
    deshacer(m);
    expect(forma_("A")?.querySelector("title")?.textContent).toBe("Caja A"); // vuelve al nombre
  });

  it("lo que se teclea en el campo no toca el editor (Supr no borra la forma)", () => {
    const m = montar(base());
    clic(m, 150, 130);
    fireEvent.keyDown(campoDescripcion(), { key: "Delete" });
    fireEvent.keyDown(campoDescripcion(), { key: "Escape" });
    expect(forma_("A")).not.toBeNull();
    expect(m.onCambio).not.toHaveBeenCalled();
  });
});
