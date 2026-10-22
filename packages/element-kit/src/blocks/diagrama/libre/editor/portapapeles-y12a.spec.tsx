import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { conectarFormas, existeConector, validarFragmento, type Escena, type Forma, type Linea, type Texto } from "@lumina/drawing";
import { EditorLibre } from "./editor-libre.js";
import { comando, comandoDeTecla, estadoComando, textoDeAtajo } from "./comandos-registro.js";
import { MIME_FRAGMENTO } from "./portapapeles.js";
import { botonCinta, deshabilitado, escena, forma, ids, irAPestana, linea } from "./util-pruebas.js";

afterEach(() => {
  cleanup();
  // @ts-expect-error: se limpia lo que las pruebas ponen en `document`
  delete document.execCommand;
});

/** Un portapapeles de mentira: lo que un navegador pasa en `clipboardData`. */
function portapapeles(inicial: Record<string, string> = {}) {
  const datos = new Map<string, string>(Object.entries(inicial));
  return {
    datos,
    setData: vi.fn((tipo: string, valor: string) => void datos.set(tipo, valor)),
    getData: vi.fn((tipo: string) => datos.get(tipo) ?? ""),
  };
}
type Portapapeles = ReturnType<typeof portapapeles>;

function montar(e: Escena) {
  const onCambio = vi.fn<(s: Escena) => void>();
  const onCerrar = vi.fn();
  render(<EditorLibre escena={e} onCambio={onCambio} onCerrar={onCerrar} />);
  const lienzo = screen.getByRole("application", { name: "Lienzo de dibujo" }) as unknown as SVGSVGElement;
  fireEvent.click(botonCinta("Imantar a otros elementos"));
  const vista = () => {
    const g = document.querySelector("[data-dibujo-pagina]")?.parentElement?.getAttribute("transform") ?? "";
    const m = /translate\(([-\d.e]+) ([-\d.e]+)\) scale\(([-\d.e]+)\)/.exec(g);
    return { x: Number(m?.[1]), y: Number(m?.[2]), z: Number(m?.[3]) };
  };
  return {
    lienzo,
    onCambio,
    onCerrar,
    vista,
    todo: () => fireEvent.keyDown(lienzo, { key: "a", ctrlKey: true }),
    copiar: (cb: Portapapeles) => fireEvent.copy(lienzo, { clipboardData: cb }),
    cortar: (cb: Portapapeles) => fireEvent.cut(lienzo, { clipboardData: cb }),
    pegar: (cb: Portapapeles) => fireEvent.paste(lienzo, { clipboardData: cb }),
    ultima: () => onCambio.mock.calls.at(-1)?.[0] as Escena,
    cuenta: () => onCambio.mock.calls.length,
    anuncio: () => document.querySelector("[data-dibujo-anuncio]")?.textContent ?? "",
  };
}
type M = ReturnType<typeof montar>;

const formas = (e: Escena): Forma[] => e.elementos.filter((x): x is Forma => x.tipo === "forma");
const lineas = (e: Escena): Linea[] => e.elementos.filter((x): x is Linea => x.tipo === "linea");
const textos = (e: Escena): Texto[] => e.elementos.filter((x): x is Texto => x.tipo === "texto");
const trio = (): Escena => {
  let e = escena(forma("A", 100, 100, 100, 60, { texto: "Uno" }), forma("B", 300, 100, 100, 60, { texto: "Dos" }), forma("C", 500, 100, 100, 60, { texto: "Tres" }));
  e = conectarFormas(e, "A", "B");
  return conectarFormas(e, "B", "C");
};
/** Copia todo lo que hay en la escena y devuelve el portapapeles. */
function copiarTodo(m: M): Portapapeles {
  const cb = portapapeles();
  m.todo();
  m.copiar(cb);
  return cb;
}

describe("Y12a — los atajos los resuelve el navegador (el editor no los intercepta)", () => {
  it("Ctrl+C, Ctrl+X, Ctrl+V y Ctrl+Mayús+V desde el lienzo no se cancelan", () => {
    const m = montar(trio());
    m.todo();
    for (const init of [{ key: "c" }, { key: "x" }, { key: "v" }, { key: "V", shiftKey: true }]) {
      expect(fireEvent.keyDown(m.lienzo, { ...init, ctrlKey: true })).toBe(true); // true = nadie cambió el comportamiento por defecto
    }
    expect(m.cuenta()).toBe(0);
  });

  it("los cuatro comandos están en el registro con su atajo, que se muestra pero no se intercepta", () => {
    expect(textoDeAtajo(comando("copiar"))).toBe("Ctrl+C");
    expect(textoDeAtajo(comando("cortar"))).toBe("Ctrl+X");
    expect(textoDeAtajo(comando("pegar"))).toBe("Ctrl+V");
    expect(textoDeAtajo(comando("pegar-en-sitio"))).toBe("Ctrl+Mayús+V");
    for (const id of ["copiar", "cortar", "pegar", "pegar-en-sitio"]) expect(comando(id).atajoNativo).toBe(true);
    // Cada atajo lleva a su comando, y Ctrl+Alt+C / Ctrl+Alt+V son del pincel (Y12b).
    expect(comandoDeTecla({ key: "c", ctrlKey: true, shiftKey: false, altKey: false, metaKey: false })?.id).toBe("copiar");
    expect(comandoDeTecla({ key: "V", ctrlKey: true, shiftKey: true, altKey: false, metaKey: false })?.id).toBe("pegar-en-sitio");
    expect(comandoDeTecla({ key: "v", ctrlKey: true, shiftKey: false, altKey: false, metaKey: false })?.id).toBe("pegar");
    // Ctrl+Alt+C es del pincel (Y12b), no de copiar.
    expect(comandoDeTecla({ key: "c", ctrlKey: true, shiftKey: false, altKey: true, metaKey: false })?.id).toBe("copiar-formato");
    expect(comandoDeTecla({ key: "v", ctrlKey: true, shiftKey: false, altKey: true, metaKey: false })?.id).toBe("aplicar-formato");
    expect(comandoDeTecla({ key: "C", ctrlKey: true, shiftKey: true, altKey: false, metaKey: false })).toBeNull();
  });

  it("Copiar y Cortar piden una selección; Pegar y Pegar en el mismo sitio siempre se pueden", () => {
    const ctx = (seleccion: string[], esc: Escena) => ({ escena: esc, seleccion, herramienta: { tipo: "seleccionar" as const }, puedeDeshacer: false, puedeRehacer: false, zoom: 1, cuadricula: false, imantar: false });
    const e = trio();
    expect(estadoComando(comando("copiar"), ctx([], e)).habilitado).toBe(false);
    expect(estadoComando(comando("cortar"), ctx([], e)).habilitado).toBe(false);
    expect(estadoComando(comando("copiar"), ctx(["A"], e)).habilitado).toBe(true);
    expect(estadoComando(comando("cortar"), ctx(["A"], e)).habilitado).toBe(true);
    expect(estadoComando(comando("pegar"), ctx([], e)).habilitado).toBe(true);
    expect(estadoComando(comando("pegar-en-sitio"), ctx([], e)).habilitado).toBe(true);
  });
});

describe("Y12a — copiar", () => {
  it("escribe el formato propio y el texto plano, cancela el comportamiento por defecto y no toca el historial", () => {
    const m = montar(trio());
    m.todo();
    const cb = portapapeles();
    expect(m.copiar(cb)).toBe(false); // false = se canceló el comportamiento por defecto
    const json = cb.datos.get(MIME_FRAGMENTO) ?? "";
    expect(validarFragmento(JSON.parse(json))?.elementos).toHaveLength(5); // 3 formas y 2 conectores
    expect(cb.datos.get("text/plain")).toBe("Uno\nDos\nTres");
    expect(m.cuenta()).toBe(0);
    expect(m.anuncio()).toBe("5 elementos copiados.");
  });

  it("más de 500 elementos no se copian: se avisa y el portapapeles queda como estaba", () => {
    const m = montar(escena(...Array.from({ length: 501 }, (_, i) => forma(`f${i}`, (i % 50) * 20, Math.floor(i / 50) * 20, 10, 10))));
    m.todo();
    const cb = portapapeles({ "text/plain": "lo de antes" });
    m.copiar(cb);
    expect(cb.setData).not.toHaveBeenCalled();
    expect(m.anuncio()).toMatch(/demasiado para copiar/);
  });

  it("sin nada elegido no se interviene: el navegador hace lo suyo", () => {
    const m = montar(trio());
    const cb = portapapeles();
    expect(m.copiar(cb)).toBe(true);
    expect(cb.setData).not.toHaveBeenCalled();
  });

  it("no se llega al editor de diapositivas: ni copiar, ni cortar, ni pegar suben por el documento", () => {
    const m = montar(trio());
    m.todo();
    const visto = vi.fn();
    for (const t of ["copy", "cut", "paste"]) document.addEventListener(t, visto);
    const cb = portapapeles();
    m.copiar(cb);
    m.pegar(cb);
    m.cortar(portapapeles());
    for (const t of ["copy", "cut", "paste"]) document.removeEventListener(t, visto);
    expect(visto).not.toHaveBeenCalled();
  });
});

describe("Y12a — pegar", () => {
  it("copiar y pegar un trío conserva forma, texto y topología, con ids nuevos, desplazado 20 y UNA entrada de historial", () => {
    const m = montar(trio());
    const cb = copiarTodo(m);
    expect(m.pegar(cb)).toBe(false);
    expect(m.cuenta()).toBe(1);
    const e = m.ultima();
    expect(formas(e)).toHaveLength(6);
    expect(lineas(e)).toHaveLength(4);
    const ids2 = e.elementos.map((x) => x.id);
    expect(new Set(ids2).size).toBe(ids2.length);
    const nuevas = formas(e).slice(3);
    expect(nuevas.map((f) => f.texto)).toEqual(["Uno", "Dos", "Tres"]);
    expect(nuevas[0]?.transformacion.x).toBe(120);
    expect(nuevas[0]?.transformacion.y).toBe(120);
    const [a2, b2, c2] = nuevas.map((f) => f.id) as [string, string, string];
    expect(existeConector(e, a2, b2)).toBe(true);
    expect(existeConector(e, b2, c2)).toBe(true);
    expect(existeConector(e, a2, "B")).toBe(false);
    expect(m.anuncio()).toBe("3 elementos pegados.");
  });

  it("lo pegado queda elegido y deshacer lo quita de una vez", () => {
    const m = montar(trio());
    const cb = copiarTodo(m);
    m.pegar(cb);
    // La selección son las 3 formas nuevas: copiarlas de nuevo da 3 formas + 2 conectores.
    const cb2 = portapapeles();
    m.copiar(cb2);
    expect(validarFragmento(JSON.parse(cb2.datos.get(MIME_FRAGMENTO) ?? ""))?.elementos).toHaveLength(5);
    expect(formas(m.ultima()).length).toBe(6);
    fireEvent.keyDown(m.lienzo, { key: "z", ctrlKey: true });
    expect(formas(m.ultima())).toHaveLength(3);
  });

  it("pegar varias veces seguidas desplaza 20 más cada vez: no se superponen", () => {
    const m = montar(escena(forma("A", 100, 100, 100, 60)));
    const cb = copiarTodo(m);
    for (let i = 0; i < 3; i++) m.pegar(cb);
    expect(formas(m.ultima()).map((f) => f.transformacion.x)).toEqual([100, 120, 140, 160]);
    expect(formas(m.ultima()).map((f) => f.transformacion.y)).toEqual([100, 120, 140, 160]);
    expect(m.cuenta()).toBe(3);
  });

  it("copiar otra vez reinicia el desplazamiento", () => {
    const m = montar(escena(forma("A", 100, 100, 100, 60)));
    const cb = copiarTodo(m);
    m.pegar(cb);
    m.pegar(cb);
    m.todo();
    const cb2 = portapapeles();
    m.copiar(cb2); // copia las 3 formas
    m.pegar(cb2);
    const xs = formas(m.ultima()).map((f) => f.transformacion.x);
    expect(xs.slice(3)).toEqual([120, 140, 160]);
  });

  it("copiar lo mismo otra vez reinicia el desplazamiento, aunque el contenido copiado sea idéntico", () => {
    const m = montar(escena(forma("A", 100, 100, 100, 60)));
    const cb = copiarTodo(m);
    m.pegar(cb);
    m.pegar(cb);
    fireEvent.keyDown(m.lienzo, { key: "z", ctrlKey: true });
    fireEvent.keyDown(m.lienzo, { key: "z", ctrlKey: true }); // la escena vuelve a la original
    const cb2 = copiarTodo(m);
    expect(cb2.datos.get(MIME_FRAGMENTO)).toBe(cb.datos.get(MIME_FRAGMENTO)); // exactamente lo mismo
    m.pegar(cb2);
    expect(formas(m.ultima()).map((f) => f.transformacion.x)).toEqual([100, 120]);
  });

  it("«en el mismo sitio» (Ctrl+Mayús+V) no desplaza", () => {
    const m = montar(escena(forma("A", 100, 100, 100, 60)));
    const cb = copiarTodo(m);
    fireEvent.keyDown(m.lienzo, { key: "V", ctrlKey: true, shiftKey: true });
    m.pegar(cb);
    expect(formas(m.ultima())[1]?.transformacion).toMatchObject({ x: 100, y: 100 });
    // Y el Ctrl+V siguiente, sin Mayús, vuelve a desplazar.
    fireEvent.keyDown(m.lienzo, { key: "v", ctrlKey: true });
    m.pegar(cb);
    expect(formas(m.ultima())[2]?.transformacion).toMatchObject({ x: 120, y: 120 });
  });

  it("si lo copiado ya no está a la vista, se pega al centro de lo que se ve (y cada pegado baja 20)", () => {
    const m = montar(escena(forma("A", 100, 100, 100, 60)));
    const cb = copiarTodo(m);
    fireEvent.wheel(m.lienzo, { deltaX: 0, deltaY: 2000 }); // se desplaza la vista lejos del original
    m.pegar(cb);
    const v = m.vista();
    const f = formas(m.ultima())[1] as Forma;
    const centro = { x: f.transformacion.x + f.transformacion.ancho / 2, y: f.transformacion.y + f.transformacion.alto / 2 };
    expect(centro.x).toBeCloseTo((500 - v.x) / v.z, 0);
    expect(centro.y).toBeCloseTo((300 - v.y) / v.z, 0);
    m.pegar(cb);
    const g = formas(m.ultima())[2] as Forma;
    expect(g.transformacion.x - f.transformacion.x).toBeCloseTo(20, 5);
  });

  it("entre dos editores: se copia en uno y se pega en otro con lo que traía el portapapeles", () => {
    const a = montar(trio());
    const cb = copiarTodo(a);
    cleanup();
    const b = montar(escena(forma("A", 10, 10), forma("Z", 800, 400)));
    b.pegar(cb);
    const e = b.ultima();
    expect(formas(e)).toHaveLength(5);
    expect(lineas(e)).toHaveLength(2);
    const ids2 = e.elementos.map((x) => x.id);
    expect(new Set(ids2).size).toBe(ids2.length); // el «A» de la otra escena no choca con el «A» de esta
    expect(getTextos(e)).toEqual(expect.arrayContaining(["Uno", "Dos", "Tres"]));
    // Los conectores pegados unen las copias, no las formas que ya había con el mismo id.
    expect(lineas(e).every((l) => l.origen?.elementoId !== "A" && l.destino?.elementoId !== "A")).toBe(true);
  });

  it("texto plano (de otra aplicación o de una diapositiva) se pega como UN cuadro de texto", () => {
    const m = montar(escena());
    m.pegar(portapapeles({ "text/plain": "Primera línea\r\nSegunda línea\r\n\r\n" }));
    const t = textos(m.ultima());
    expect(t).toHaveLength(1);
    expect(t[0]?.texto).toBe("Primera línea\nSegunda línea");
    expect(m.cuenta()).toBe(1);
    expect(m.anuncio()).toBe("Texto pegado en un cuadro de texto.");
    expect(formas(m.ultima())).toHaveLength(0);
  });

  it("el texto plano que es el de la última copia recupera el dibujo (por si el navegador quitó el formato propio)", () => {
    const m = montar(trio());
    const cb = copiarTodo(m);
    m.pegar(portapapeles({ "text/plain": cb.datos.get("text/plain") ?? "" }));
    expect(formas(m.ultima())).toHaveLength(6);
    expect(textos(m.ultima())).toHaveLength(0);
  });

  it("el texto demasiado largo se rechaza con un aviso", () => {
    const m = montar(escena());
    m.pegar(portapapeles({ "text/plain": "x".repeat(5001) }));
    expect(m.cuenta()).toBe(0);
    expect(m.anuncio()).toMatch(/demasiado largo/);
    m.pegar(portapapeles({ "text/plain": "x".repeat(5000) }));
    expect(textos(m.ultima())).toHaveLength(1);
  });

  it("un portapapeles vacío avisa y no cambia nada", () => {
    const m = montar(trio());
    m.pegar(portapapeles());
    expect(m.cuenta()).toBe(0);
    expect(m.anuncio()).toBe("No hay nada que pegar.");
  });
});

const getTextos = (e: Escena): string[] => formas(e).map((f) => f.texto ?? "");

describe("Y12a — lo que viene del portapapeles no es de fiar", () => {
  const rechaza = (m: M, cb: Portapapeles): void => {
    const antes = m.cuenta();
    m.pegar(cb);
    expect(m.cuenta()).toBe(antes);
  };

  it("JSON que no lo es, otro formato, otra versión, sin elementos: se rechazan con un aviso", () => {
    const m = montar(trio());
    rechaza(m, portapapeles({ [MIME_FRAGMENTO]: "{no es json" }));
    expect(m.anuncio()).toMatch(/no es un dibujo válido/);
    rechaza(m, portapapeles({ [MIME_FRAGMENTO]: JSON.stringify({ formato: "otra-cosa", version: 1, elementos: [forma("a", 0, 0)] }) }));
    rechaza(m, portapapeles({ [MIME_FRAGMENTO]: JSON.stringify({ formato: "lumina-dibujo", version: 2, elementos: [forma("a", 0, 0)] }) }));
    rechaza(m, portapapeles({ [MIME_FRAGMENTO]: JSON.stringify({ formato: "lumina-dibujo", version: 1, elementos: [] }) }));
    rechaza(m, portapapeles({ [MIME_FRAGMENTO]: "null" }));
    rechaza(m, portapapeles({ [MIME_FRAGMENTO]: "[]" }));
    expect(m.anuncio()).toMatch(/no es un dibujo válido/);
  });

  it("501 elementos se rechazan; 500 se pegan", () => {
    const m = montar(escena());
    const frag = (n: number) => JSON.stringify({ formato: "lumina-dibujo", version: 1, elementos: Array.from({ length: n }, (_, i) => forma(`f${i}`, i, 0)) });
    rechaza(m, portapapeles({ [MIME_FRAGMENTO]: frag(501) }));
    m.pegar(portapapeles({ [MIME_FRAGMENTO]: frag(500) }));
    expect(formas(m.ultima())).toHaveLength(500);
  });

  it("más de 1 MB se rechaza sin ni siquiera leerlo", () => {
    const m = montar(trio());
    const enorme = JSON.stringify({ formato: "lumina-dibujo", version: 1, elementos: [forma("a", 0, 0, 100, 60, { texto: "x".repeat(1_000_001) })] });
    rechaza(m, portapapeles({ [MIME_FRAGMENTO]: enorme }));
    expect(m.anuncio()).toMatch(/demasiado grande/);
  });

  it("ids repetidos, tipos desconocidos y cosas que no son elementos se rechazan", () => {
    const m = montar(trio());
    const f = (elementos: unknown[]) => portapapeles({ [MIME_FRAGMENTO]: JSON.stringify({ formato: "lumina-dibujo", version: 1, elementos }) });
    rechaza(m, f([forma("a", 0, 0), forma("a", 10, 10)]));
    rechaza(m, f([forma("a", 0, 0), { id: "x", tipo: "script", codigo: "alert(1)" }]));
    rechaza(m, f([forma("a", 0, 0), null, "x", 3]));
  });

  it("un __proto__ hostil no contamina nada y números absurdos quedan normalizados", () => {
    const m = montar(escena());
    const texto = `{"formato":"lumina-dibujo","version":1,"__proto__":{"contaminado":true},"elementos":[{"id":"a","tipo":"forma","forma":"rectangulo","__proto__":{"contaminado":true},"transformacion":{"x":1e308,"y":-1e308,"ancho":99999999,"alto":-5,"rotacion":1e999}}]}`;
    m.pegar(portapapeles({ [MIME_FRAGMENTO]: texto }));
    expect(({} as Record<string, unknown>).contaminado).toBeUndefined();
    for (const f of formas(m.ultima())) for (const n of Object.values(f.transformacion)) expect(Number.isFinite(n)).toBe(true);
  });

  it("un portapapeles que lanza al leerse no tumba el editor", () => {
    const m = montar(trio());
    const malo = { getData: () => { throw new Error("bloqueado"); } };
    fireEvent.paste(m.lienzo, { clipboardData: malo });
    expect(m.cuenta()).toBe(0);
    expect(m.anuncio()).toMatch(/No se pudo leer/);
  });
});

describe("Y12a — cortar", () => {
  it("copia y quita lo elegido en UNA entrada de historial, y deshacer lo devuelve de una vez", () => {
    const m = montar(trio());
    m.todo();
    const cb = portapapeles();
    expect(m.cortar(cb)).toBe(false);
    expect(validarFragmento(JSON.parse(cb.datos.get(MIME_FRAGMENTO) ?? ""))?.elementos).toHaveLength(5);
    expect(m.cuenta()).toBe(1);
    expect(m.ultima().elementos).toHaveLength(0);
    expect(m.anuncio()).toBe("5 elementos cortados.");
    fireEvent.keyDown(m.lienzo, { key: "z", ctrlKey: true });
    expect(m.ultima().elementos).toHaveLength(5);
    expect(m.cuenta()).toBe(2); // deshacer también avisa al bloque, pero cortar fue una sola entrada
  });

  it("lo cortado se pega después", () => {
    const m = montar(escena(forma("A", 100, 100, 100, 60, { texto: "Hola" })));
    m.todo();
    const cb = portapapeles();
    m.cortar(cb);
    expect(ids(m.ultima())).toEqual([]);
    m.pegar(cb);
    expect(formas(m.ultima())).toHaveLength(1);
    expect(formas(m.ultima())[0]?.texto).toBe("Hola");
  });

  it("sin nada elegido no se interviene", () => {
    const m = montar(trio());
    const cb = portapapeles();
    expect(m.cortar(cb)).toBe(true);
    expect(cb.setData).not.toHaveBeenCalled();
    expect(m.cuenta()).toBe(0);
  });

  it("un conector suelto elegido se corta y se pega con sus extremos sueltos", () => {
    const m = montar(escena(linea("L", [[0, 0], [100, 100]], { fin: "flecha" })));
    m.todo();
    const cb = portapapeles();
    m.cortar(cb);
    m.pegar(cb);
    expect(lineas(m.ultima())).toHaveLength(1);
    expect(lineas(m.ultima())[0]?.fin).toBe("flecha");
  });
});

describe("Y12a — con un cuadro de texto en edición, Ctrl+C/X/V son los del navegador", () => {
  it("copiar, cortar y pegar dentro del cuadro no se interceptan", () => {
    const m = montar(escena(forma("A", 100, 100, 200, 120, { texto: "Uno" })));
    const v = m.vista();
    fireEvent.doubleClick(m.lienzo, { clientX: v.x + 200 * v.z, clientY: v.y + 160 * v.z });
    const caja = screen.getByRole("textbox", { name: "Texto del elemento" });
    const cb = portapapeles({ "text/plain": "otra cosa", [MIME_FRAGMENTO]: "{}" });
    expect(fireEvent.copy(caja, { clipboardData: cb })).toBe(true);
    expect(fireEvent.cut(caja, { clipboardData: cb })).toBe(true);
    expect(fireEvent.paste(caja, { clipboardData: cb })).toBe(true);
    expect(cb.setData).not.toHaveBeenCalled();
    expect(m.cuenta()).toBe(0);
    // Y no se filtra al editor de diapositivas.
    const visto = vi.fn();
    document.addEventListener("paste", visto);
    fireEvent.paste(caja, { clipboardData: cb });
    document.removeEventListener("paste", visto);
    expect(visto).not.toHaveBeenCalled();
  });

  it("con texto seleccionado fuera del lienzo, copiar no se intercepta", () => {
    const m = montar(trio());
    m.todo();
    const seleccionado = vi.spyOn(window, "getSelection").mockReturnValue({ toString: () => "texto del panel" } as unknown as Selection);
    const cb = portapapeles();
    expect(m.copiar(cb)).toBe(true);
    expect(cb.setData).not.toHaveBeenCalled();
    seleccionado.mockRestore();
  });
});

describe("Y12a — los botones de la cinta", () => {
  it("Copiar y Cortar están deshabilitados sin selección; Pegar y Pegar en el mismo sitio no", () => {
    montar(trio());
    expect(deshabilitado(botonCinta("Copiar"))).toBe(true);
    expect(deshabilitado(botonCinta("Cortar"))).toBe(true);
    expect(deshabilitado(botonCinta("Pegar"))).toBe(false);
    expect(deshabilitado(botonCinta("Pegar en el mismo sitio"))).toBe(false);
  });

  it("si el navegador da el evento (execCommand), el botón Copiar lo usa y no copia dos veces", () => {
    const m = montar(trio());
    m.todo();
    const cb = portapapeles();
    const exec = vi.fn((_orden: string) => {
      m.copiar(cb);
      return true;
    });
    (document as unknown as { execCommand: typeof exec }).execCommand = exec;
    fireEvent.click(botonCinta("Copiar"));
    expect(exec).toHaveBeenCalledWith("copy");
    expect(cb.setData).toHaveBeenCalledTimes(2); // el formato propio y el texto plano, una sola vez
    expect(m.anuncio()).toBe("5 elementos copiados.");
  });

  it("sin execCommand, Copiar copia dentro del editor y Pegar la pega (lo que un botón puede hacer sin permiso)", () => {
    const m = montar(trio());
    m.todo();
    irAPestana("Inicio");
    fireEvent.click(botonCinta("Copiar"));
    expect(m.anuncio()).toBe("5 elementos copiados.");
    fireEvent.click(botonCinta("Pegar"));
    expect(formas(m.ultima())).toHaveLength(6);
    expect(formas(m.ultima())[3]?.transformacion.x).toBe(120);
    expect(m.cuenta()).toBe(1);
  });

  it("Pegar en el mismo sitio, desde el botón, no desplaza", () => {
    const m = montar(escena(forma("A", 100, 100, 100, 60)));
    m.todo();
    fireEvent.click(botonCinta("Copiar"));
    fireEvent.click(botonCinta("Pegar en el mismo sitio"));
    expect(formas(m.ultima())[1]?.transformacion).toMatchObject({ x: 100, y: 100 });
  });

  it("Pegar sin haber copiado nada aquí explica que hay que usar Ctrl+V", () => {
    const m = montar(trio());
    fireEvent.click(botonCinta("Pegar"));
    expect(m.cuenta()).toBe(0);
    expect(m.anuncio()).toMatch(/Ctrl\+V/);
  });

  it("el botón Cortar sin execCommand copia y quita en un paso, y Pegar lo devuelve", () => {
    const m = montar(escena(forma("A", 100, 100, 100, 60, { texto: "Hola" })));
    m.todo();
    fireEvent.click(botonCinta("Cortar"));
    expect(m.ultima().elementos).toHaveLength(0);
    expect(m.cuenta()).toBe(1);
    fireEvent.click(botonCinta("Pegar"));
    expect(formas(m.ultima())).toHaveLength(1);
    expect(m.cuenta()).toBe(2);
  });
});
