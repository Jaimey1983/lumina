import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Escena, Forma, Linea } from "@lumina/drawing";
import { EditorLibre } from "./editor-libre.js";
import { comando, textoDeAtajo } from "./comandos-registro.js";
import { botonCinta, deshabilitado, escena, forma, linea } from "./util-pruebas.js";

afterEach(cleanup);

const ROJO = { relleno: { tipo: "solido", color: "#ff0000" }, contorno: { color: "#00ff00", grosor: 5, patron: "guiones" }, opacidad: 0.5, sombra: { color: "#00000080", desenfoque: 6, dx: 3, dy: 4 }, radio: 12 };
const TEXTO_ROJO = { tamano: 30, negrita: true, cursiva: true, subrayado: true, alineacionH: "derecha", alineacionV: "abajo", color: "#0000ff", fuente: "Georgia" };
const base = (): Escena =>
  escena(
    forma("A", 100, 100, 120, 80, { texto: "Rojo", estilo: ROJO, estiloTexto: TEXTO_ROJO }),
    forma("B", 400, 100, 120, 80, { texto: "B" }),
    forma("C", 700, 100, 120, 80, { texto: "C" }),
  );

function montar(e: Escena) {
  const onCambio = vi.fn<(s: Escena) => void>();
  render(<EditorLibre escena={e} onCambio={onCambio} onCerrar={() => {}} />);
  const lienzo = screen.getByRole("application", { name: "Lienzo de dibujo" }) as unknown as SVGSVGElement;
  fireEvent.click(botonCinta("Imantar a otros elementos"));
  const vista = () => {
    const g = document.querySelector("[data-dibujo-pagina]")?.parentElement?.getAttribute("transform") ?? "";
    const m = /translate\(([-\d.e]+) ([-\d.e]+)\) scale\(([-\d.e]+)\)/.exec(g);
    return { x: Number(m?.[1]), y: Number(m?.[2]), z: Number(m?.[3]) };
  };
  const evento = (tipo: string, x: number, y: number, extra: Record<string, unknown> = {}): void => {
    const v = vista();
    fireEvent(lienzo, new MouseEvent(tipo, { bubbles: true, cancelable: true, button: 0, clientX: v.x + x * v.z, clientY: v.y + y * v.z, ...extra }));
  };
  const m = {
    lienzo,
    onCambio,
    vista,
    evento,
    clic: (x: number, y: number) => {
      evento("pointerdown", x, y);
      evento("pointerup", x, y);
    },
    /** Elige un elemento haciendo clic en su centro (en coordenadas de escena). */
    elegir: (id: string, esc: Escena) => {
      const f = esc.elementos.find((x) => x.id === id && x.tipo === "forma") as Forma;
      m.clic(f.transformacion.x + f.transformacion.ancho / 2, f.transformacion.y + f.transformacion.alto / 2);
    },
    arrastrar: (desde: [number, number], hasta: [number, number]) => {
      evento("pointerdown", desde[0], desde[1]);
      for (let i = 1; i <= 6; i++) evento("pointermove", desde[0] + ((hasta[0] - desde[0]) * i) / 6, desde[1] + ((hasta[1] - desde[1]) * i) / 6);
      evento("pointerup", hasta[0], hasta[1]);
    },
    ultima: () => onCambio.mock.calls.at(-1)?.[0] as Escena,
    cuenta: () => onCambio.mock.calls.length,
    anuncio: () => document.querySelector("[data-dibujo-anuncio]")?.textContent ?? "",
    tecla: (init: KeyboardEventInit) => fireEvent.keyDown(lienzo, init),
  };
  return m;
}
type M = ReturnType<typeof montar>;

const forma_ = (e: Escena, id: string): Forma => e.elementos.find((x) => x.id === id) as Forma;
const linea_ = (e: Escena, id: string): Linea => e.elementos.find((x) => x.id === id) as Linea;
const pincel = (): HTMLButtonElement => botonCinta("Copiar formato");
const aplicar = (): HTMLButtonElement => botonCinta("Aplicar formato");
const activo = (b: HTMLElement): boolean => b.getAttribute("aria-pressed") === "true";
/** Elige A y arma el pincel (una vez). */
function armar(m: M, esc: Escena, id = "A"): void {
  m.elegir(id, esc);
  fireEvent.click(pincel());
}

describe("Y12b — el comando y su estado", () => {
  it("«Copiar formato» (Ctrl+Alt+C) y «Aplicar formato» (Ctrl+Alt+V) están en el registro con sus atajos", () => {
    expect(textoDeAtajo(comando("copiar-formato"))).toBe("Ctrl+Alt+C");
    expect(textoDeAtajo(comando("aplicar-formato"))).toBe("Ctrl+Alt+V");
  });

  it("sin selección «Copiar formato» está deshabilitado; sin formato guardado «Aplicar formato» también, con su motivo", () => {
    const e = base();
    const m = montar(e);
    expect(deshabilitado(pincel())).toBe(true);
    expect(deshabilitado(aplicar())).toBe(true);
    expect(aplicar().getAttribute("title")).toMatch(/Copia un formato primero/);
    m.elegir("A", e);
    expect(deshabilitado(pincel())).toBe(false);
    expect(deshabilitado(aplicar())).toBe(true); // aún no se copió ninguno
    fireEvent.click(pincel());
    fireEvent.keyDown(m.lienzo, { key: "Escape" });
    expect(deshabilitado(aplicar())).toBe(false); // hay formato y hay selección
    m.clic(900, 500); // vacío: se limpia la selección
    expect(deshabilitado(aplicar())).toBe(true);
    expect(aplicar().getAttribute("title")).toMatch(/Elige un elemento/);
  });

  it("copiar el formato de un grupo toma el de su primer elemento", () => {
    const e = escena(forma("A", 100, 100, 120, 80, { estilo: ROJO }), forma("B", 400, 100, 120, 80), { id: "g", tipo: "grupo", hijos: ["A", "B"] }, forma("C", 700, 100, 120, 80));
    const m = montar(e);
    m.elegir("A", e); // elige el grupo
    fireEvent.click(pincel());
    m.clic(760, 140);
    expect(forma_(m.ultima(), "C").estilo.opacidad).toBe(0.5);
  });
});

describe("Y12b — un solo uso", () => {
  it("copia el formato, aplica con un clic al siguiente elemento, una entrada de historial, y sale del modo", () => {
    const e = base();
    const m = montar(e);
    armar(m, e);
    expect(activo(pincel())).toBe(true);
    expect(m.anuncio()).toMatch(/Pincel/);
    m.clic(460, 140); // B
    expect(m.cuenta()).toBe(1);
    const b = forma_(m.ultima(), "B");
    expect(b.estilo).toEqual(forma_(e, "A").estilo);
    expect(b.estiloTexto).toEqual(forma_(e, "A").estiloTexto);
    expect(b.texto).toBe("B"); // el texto no se toca
    expect(b.transformacion).toEqual(forma_(e, "B").transformacion);
    expect(m.anuncio()).toBe("Formato aplicado a 1 elemento.");
    // Salió del modo: el pincel ya no está activo y un clic en C no la formatea.
    expect(activo(pincel())).toBe(false);
    m.clic(760, 140);
    expect(m.cuenta()).toBe(1);
    expect(forma_(m.ultima(), "C").estilo.opacidad).toBe(1);
  });

  it("lo formateado queda elegido", () => {
    const e = base();
    const m = montar(e);
    armar(m, e);
    m.clic(460, 140);
    // Elegido: Copiar formato vuelve a estar habilitado con B de origen.
    fireEvent.click(pincel());
    m.clic(760, 140);
    expect(forma_(m.ultima(), "C").estilo.opacidad).toBe(0.5); // C recibió el formato (que B ya tenía)
  });

  it("deshacer quita el formato de una vez", () => {
    const e = base();
    const m = montar(e);
    armar(m, e);
    m.clic(460, 140);
    m.tecla({ key: "z", ctrlKey: true });
    expect(forma_(m.ultima(), "B").estilo).toEqual(forma_(e, "B").estilo);
  });

  it("un segundo clic en el botón, con el pincel en uso, lo suelta (como en Office)", () => {
    const e = base();
    const m = montar(e);
    armar(m, e);
    fireEvent.click(pincel());
    expect(activo(pincel())).toBe(false);
    expect(m.anuncio()).toBe("Pincel cancelado.");
    m.clic(460, 140);
    expect(m.cuenta()).toBe(0);
  });

  it("Escape sale del modo y no cambia nada", () => {
    const e = base();
    const m = montar(e);
    armar(m, e);
    m.tecla({ key: "Escape" });
    expect(activo(pincel())).toBe(false);
    expect(m.anuncio()).toBe("Pincel cancelado.");
    m.clic(460, 140);
    expect(m.cuenta()).toBe(0);
  });

  it("Ctrl+Alt+C arma el pincel desde el teclado", () => {
    const e = base();
    const m = montar(e);
    m.elegir("A", e);
    m.tecla({ key: "c", ctrlKey: true, altKey: true });
    expect(activo(pincel())).toBe(true);
    m.clic(460, 140);
    expect(forma_(m.ultima(), "B").estilo.opacidad).toBe(0.5);
  });

  it("sin nada elegido avisa y no arma el pincel", () => {
    const m = montar(base());
    m.tecla({ key: "c", ctrlKey: true, altKey: true });
    expect(activo(pincel())).toBe(false);
    expect(m.anuncio()).toMatch(/Elige un elemento/);
  });

  it("con el pincel, un clic en el vacío no hace nada y sigue en modo; un clic sobre el elemento no lo mueve", () => {
    const e = base();
    const m = montar(e);
    armar(m, e);
    m.clic(900, 500);
    expect(activo(pincel())).toBe(true);
    expect(m.cuenta()).toBe(0);
    m.arrastrar([460, 140], [462, 142]); // un temblor de pulso: sigue siendo un clic
    expect(m.cuenta()).toBe(1);
    expect(forma_(m.ultima(), "B").transformacion).toEqual(forma_(e, "B").transformacion);
  });

  it("arrastrar desde un elemento con el pincel no lo mueve ni aplica nada", () => {
    const e = base();
    const m = montar(e);
    armar(m, e);
    m.arrastrar([460, 140], [560, 260]);
    expect(m.cuenta()).toBe(0);
    expect(activo(pincel())).toBe(true);
  });

  it("arrastrar desde un elemento con el pincel no se toma por un recuadro, aunque abarque otros", () => {
    const e = escena(
      forma("A", 100, 100, 120, 80, { estilo: ROJO }),
      forma("B", 400, 100, 120, 80),
      forma("D", 550, 150, 40, 30), // queda dentro del rectángulo que se arrastra
    );
    const m = montar(e);
    armar(m, e);
    m.arrastrar([460, 140], [700, 300]);
    expect(m.cuenta()).toBe(0);
    expect(activo(pincel())).toBe(true);
  });

  it("con varios elegidos, el formato que se copia es el del primero que se eligió", () => {
    const e = base();
    const m = montar(e);
    m.elegir("A", e);
    m.evento("pointerdown", 460, 140, { shiftKey: true }); // B se suma: la selección es [A, B]
    m.evento("pointerup", 460, 140, { shiftKey: true });
    fireEvent.click(pincel());
    m.clic(760, 140); // C
    expect(forma_(m.ultima(), "C").estilo.opacidad).toBe(0.5); // el de A, no el de B
  });

  it("Ctrl+Alt+V con el pincel de un solo uso en marcha no lo suelta", () => {
    const e = base();
    const m = montar(e);
    armar(m, e);
    m.tecla({ key: "v", ctrlKey: true, altKey: true });
    expect(activo(pincel())).toBe(true);
    m.clic(460, 140);
    expect(forma_(m.ultima(), "B").estilo.opacidad).toBe(0.5);
  });

  it("con el pincel el doble clic no abre el texto de la forma", () => {
    const e = base();
    const m = montar(e);
    armar(m, e);
    const v = m.vista();
    fireEvent.doubleClick(m.lienzo, { clientX: v.x + 460 * v.z, clientY: v.y + 140 * v.z });
    expect(screen.queryByRole("textbox", { name: "Texto del elemento" })).toBeNull();
  });

  it("elegir una herramienta de crear saca del pincel", () => {
    const e = base();
    const m = montar(e);
    armar(m, e);
    fireEvent.click(botonCinta("Línea"));
    expect(activo(pincel())).toBe(false);
    fireEvent.click(botonCinta("Seleccionar"));
    m.clic(460, 140);
    expect(m.cuenta()).toBe(0);
  });

  it("armar el pincel con otra herramienta activa vuelve a Seleccionar", () => {
    const e = base();
    const m = montar(e);
    m.elegir("A", e);
    fireEvent.click(botonCinta("Línea"));
    expect(activo(botonCinta("Línea"))).toBe(true);
    fireEvent.click(pincel());
    expect(activo(pincel())).toBe(true);
    expect(activo(botonCinta("Línea"))).toBe(false);
    expect(activo(botonCinta("Seleccionar"))).toBe(true);
    m.clic(460, 140);
    expect(forma_(m.ultima(), "B").estilo.opacidad).toBe(0.5);
  });

  it("la barra de estado explica el pincel y el cursor cambia", () => {
    const e = base();
    const m = montar(e);
    armar(m, e);
    m.evento("pointermove", 460, 140);
    expect(m.lienzo.style.cursor).toBe("copy");
    expect(document.body.textContent).toMatch(/Pincel: haz clic en un elemento/);
  });
});

describe("Y12b — fijo", () => {
  it("con Mayús al elegirlo queda fijo: cada clic formatea un elemento, una entrada de historial cada uno", () => {
    const e = base();
    const m = montar(e);
    m.elegir("A", e);
    fireEvent.click(pincel(), { shiftKey: true });
    expect(pincel().hasAttribute("data-fija")).toBe(true);
    m.clic(460, 140);
    m.clic(760, 140);
    expect(m.cuenta()).toBe(2);
    expect(forma_(m.ultima(), "B").estilo.opacidad).toBe(0.5);
    expect(forma_(m.ultima(), "C").estilo.opacidad).toBe(0.5);
    expect(activo(pincel())).toBe(true);
    expect(pincel().hasAttribute("data-fija")).toBe(true);
  });

  it("el doble clic en el botón también lo deja fijo", () => {
    const e = base();
    const m = montar(e);
    m.elegir("A", e);
    const b = pincel();
    fireEvent.click(b);
    fireEvent.click(b);
    fireEvent.doubleClick(b);
    expect(pincel().hasAttribute("data-fija")).toBe(true);
    m.clic(460, 140);
    m.clic(760, 140);
    expect(m.cuenta()).toBe(2);
  });

  it("sigue fijo hasta que se sale con Escape", () => {
    const e = base();
    const m = montar(e);
    m.elegir("A", e);
    fireEvent.click(pincel(), { shiftKey: true });
    m.clic(460, 140);
    m.tecla({ key: "Escape" });
    expect(activo(pincel())).toBe(false);
    expect(pincel().hasAttribute("data-fija")).toBe(false);
    m.clic(760, 140);
    expect(m.cuenta()).toBe(1);
  });

  it("la fija conserva el formato de origen aunque lo formateado quede elegido", () => {
    const e = base();
    const m = montar(e);
    m.elegir("A", e);
    fireEvent.click(pincel(), { shiftKey: true });
    m.clic(460, 140); // B queda elegida, pero el formato guardado sigue siendo el de A
    m.clic(760, 140);
    expect(forma_(m.ultima(), "C").estilo).toEqual(forma_(e, "A").estilo);
  });
});

describe("Y12b — destinos varios, recuadro y bloqueados", () => {
  it("un recuadro desde el vacío formatea todo lo que abarca en UNA entrada de historial", () => {
    const e = base();
    const m = montar(e);
    armar(m, e);
    m.arrastrar([350, 60], [900, 260]); // abarca B y C, no A
    expect(m.cuenta()).toBe(1);
    expect(forma_(m.ultima(), "B").estilo.opacidad).toBe(0.5);
    expect(forma_(m.ultima(), "C").estilo.opacidad).toBe(0.5);
    expect(m.anuncio()).toBe("Formato aplicado a 2 elementos.");
    expect(activo(pincel())).toBe(false); // una vez: sale
    m.tecla({ key: "z", ctrlKey: true });
    expect(forma_(m.ultima(), "B").estilo.opacidad).toBe(1);
    expect(forma_(m.ultima(), "C").estilo.opacidad).toBe(1);
  });

  it("el recuadro se ve mientras se arrastra y desaparece al soltar", () => {
    const e = base();
    const m = montar(e);
    armar(m, e);
    m.evento("pointerdown", 350, 60);
    m.evento("pointermove", 600, 200);
    m.evento("pointermove", 900, 260);
    expect(document.querySelector('[data-capa="recuadro"]')).not.toBeNull();
    m.evento("pointerup", 900, 260);
    expect(document.querySelector('[data-capa="recuadro"]')).toBeNull();
  });

  it("un recuadro que no abarca nada lo dice y el pincel sigue", () => {
    const e = base();
    const m = montar(e);
    armar(m, e);
    m.arrastrar([300, 300], [500, 450]);
    expect(m.cuenta()).toBe(0);
    expect(m.anuncio()).toBe("El recuadro no abarca nada.");
    expect(activo(pincel())).toBe(true);
  });

  it("con un grupo que tiene un hijo bloqueado, se salta ese hijo y se avisa", () => {
    const e = escena(
      forma("A", 100, 100, 120, 80, { estilo: ROJO }),
      forma("B", 400, 100, 120, 80, { bloqueado: true }),
      forma("C", 700, 100, 120, 80),
      { id: "g", tipo: "grupo", hijos: ["B", "C"] },
    );
    const m = montar(e);
    armar(m, e);
    m.clic(760, 140); // sobre C, que es del grupo «g»
    expect(m.anuncio()).toBe("Formato aplicado a 1 elemento; se saltó 1 bloqueado.");
    expect(forma_(m.ultima(), "C").estilo.opacidad).toBe(0.5);
    expect(forma_(m.ultima(), "B").estilo.opacidad).toBe(1);
  });

  it("aplicar un formato que ya tiene lo dice y no registra nada", () => {
    const e = escena(forma("A", 100, 100, 120, 80, { estilo: ROJO }), forma("B", 400, 100, 120, 80, { estilo: ROJO }));
    const m = montar(e);
    armar(m, e);
    m.clic(460, 140);
    expect(m.cuenta()).toBe(0);
    expect(m.anuncio()).toBe("Ya tenía ese formato.");
  });
});

describe("Y12b — entre formas y líneas", () => {
  const conLinea = (): Escena => escena(forma("A", 100, 100, 120, 80, { estilo: ROJO, estiloTexto: TEXTO_ROJO }), forma("B", 400, 300, 120, 80, { texto: "B" }), linea("L", [[100, 500], [500, 500]], { texto: "Sí", fin: "flecha", trazado: "recto" }));

  it("de una forma a una línea: contorno y opacidad, y nada más", () => {
    const e = conLinea();
    const m = montar(e);
    armar(m, e);
    m.clic(300, 500); // sobre la línea
    const l = linea_(m.ultima(), "L");
    expect(l.estilo.contorno).toEqual(forma_(e, "A").estilo.contorno);
    expect(l.estilo.opacidad).toBe(0.5);
    expect(l.estilo.relleno).toEqual(linea_(e, "L").estilo.relleno);
    expect(l.texto).toBe("Sí");
    expect(l.fin).toBe("flecha");
    expect(l.puntos).toEqual(linea_(e, "L").puntos);
  });

  it("de una línea a una forma: solo el contorno", () => {
    const e = escena(forma("B", 400, 300, 120, 80, { texto: "B" }), linea("L", [[100, 500], [500, 500]], { estilo: ROJO, estiloTexto: TEXTO_ROJO }));
    const m = montar(e);
    m.clic(300, 500); // elige la línea
    fireEvent.click(pincel());
    m.clic(460, 340); // sobre B
    const b = forma_(m.ultima(), "B");
    expect(b.estilo.contorno).toEqual(linea_(e, "L").estilo.contorno);
    expect(b.estilo.relleno).toEqual(forma_(e, "B").estilo.relleno);
    expect(b.estilo.opacidad).toBe(1);
    expect(b.estiloTexto).toEqual(forma_(e, "B").estiloTexto);
  });
});

describe("Y12b — «Aplicar formato» (Ctrl+Alt+V)", () => {
  it("aplica el formato guardado a la selección actual, sin entrar al modo, en una entrada de historial", () => {
    const e = base();
    const m = montar(e);
    armar(m, e);
    m.tecla({ key: "Escape" }); // se sale del modo; el formato queda guardado
    m.elegir("B", e);
    m.tecla({ key: "v", ctrlKey: true, altKey: true });
    expect(m.cuenta()).toBe(1);
    expect(forma_(m.ultima(), "B").estilo.opacidad).toBe(0.5);
    expect(activo(pincel())).toBe(false); // no se entra al modo
    m.tecla({ key: "z", ctrlKey: true });
    expect(forma_(m.ultima(), "B").estilo.opacidad).toBe(1);
  });

  it("con varios elegidos los formatea a todos de una vez", () => {
    const e = base();
    const m = montar(e);
    armar(m, e);
    m.tecla({ key: "Escape" });
    m.elegir("B", e);
    m.evento("pointerdown", 760, 140, { shiftKey: true });
    m.evento("pointerup", 760, 140, { shiftKey: true });
    m.tecla({ key: "v", ctrlKey: true, altKey: true });
    expect(m.cuenta()).toBe(1);
    expect(forma_(m.ultima(), "B").estilo.opacidad).toBe(0.5);
    expect(forma_(m.ultima(), "C").estilo.opacidad).toBe(0.5);
  });

  it("estando en modo pincel fijo, no cambia el modo", () => {
    const e = base();
    const m = montar(e);
    m.elegir("A", e);
    fireEvent.click(pincel(), { shiftKey: true });
    m.clic(460, 140);
    m.tecla({ key: "v", ctrlKey: true, altKey: true }); // B sigue elegida
    expect(activo(pincel())).toBe(true);
  });

  it("con el botón de la cinta", () => {
    const e = base();
    const m = montar(e);
    armar(m, e);
    m.tecla({ key: "Escape" });
    m.elegir("C", e);
    fireEvent.click(aplicar());
    expect(forma_(m.ultima(), "C").estilo.opacidad).toBe(0.5);
  });

  it("sigue valiendo el último formato copiado aunque se haya editado otra cosa en medio", () => {
    const e = base();
    const m = montar(e);
    armar(m, e);
    m.tecla({ key: "Escape" });
    m.elegir("B", e);
    m.tecla({ key: "d", ctrlKey: true }); // duplicar B
    const copiaId = (forma_(m.ultima(), "B") && m.ultima().elementos.filter((x) => x.tipo === "forma").at(-1)?.id) as string;
    m.tecla({ key: "v", ctrlKey: true, altKey: true });
    expect(forma_(m.ultima(), copiaId).estilo.opacidad).toBe(0.5);
  });
});
