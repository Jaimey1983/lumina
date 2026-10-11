/**
 * T20 — QR de sesión: widget nuevo (sin widget viejo con quien comparar paridad). `qrcode.react` se
 * sustituye por un doble que registra sus props, así se prueba QUÉ se le pide dibujar (URL, nivel,
 * margen, colores); el dibujo real está en `qr-sesion.real.spec.tsx`.
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { aplicarPreset } from "@lumina/editor-shared/preset-gallery";
import { elementRegistry, type ElementDefinition } from "@lumina/element-kit-core";
import "../../index.js";
import {
  createDefaultQrSesionBlock,
  limpiarCodigo,
  normalizarOrigen,
  normalizeQrSesionWidget,
  urlDeUnion,
} from "../../widgets/qr-sesion/index.js";
import { qrSesionDefinition, QR_SESION_PRESETS } from "./qr-sesion-definition.js";
import type { QrSesionConfig, QrSesionEstado } from "./qr-sesion-types.js";

const qr = vi.hoisted(() => ({ llamadas: [] as Record<string, unknown>[] }));
vi.mock("qrcode.react", () => ({
  QRCodeSVG: (props: Record<string, unknown>) => {
    qr.llamadas.push(props);
    return <svg data-testid="qr" data-value={String(props.value)} />;
  },
}));

beforeEach(() => {
  qr.llamadas.length = 0;
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const Viewer = qrSesionDefinition.Viewer;
const Editor = qrSesionDefinition.Editor;
const Props = qrSesionDefinition.Propiedades;

function con(cfg: Record<string, unknown> = {}): QrSesionEstado {
  const base = createDefaultQrSesionBlock();
  return { ...base, configuracion: { ...base.configuracion, ...cfg } } as QrSesionEstado;
}

const origenPagina = () => window.location.origin;

describe("registro", () => {
  it("está registrado como widget del lienzo, sin puntuación ni eventos (DT7)", () => {
    const def = elementRegistry.obtener("qr-sesion") as ElementDefinition<QrSesionEstado, QrSesionConfig> | undefined;
    expect(def).toBe(qrSesionDefinition);
    expect(def?.catalogo).toMatchObject({ nombre: "QR de sesión", familia: "widget", grupo: "lienzo" });
    expect(def?.puntuacion).toBeUndefined();
    expect(def?.eventos).toBeUndefined();
  });
});

describe("URL de unión", () => {
  it("<origen>/join/<código>, sin barras dobles y con el código codificado", () => {
    expect(urlDeUnion("https://lumina.edu", "ABC123")).toBe("https://lumina.edu/join/ABC123");
    expect(urlDeUnion("https://lumina.edu/", "ABC123")).toBe("https://lumina.edu/join/ABC123");
    expect(urlDeUnion("https://lumina.edu", "")).toBeNull();
    expect(urlDeUnion("https://lumina.edu", "a b/c?")).toBe("https://lumina.edu/join/abc");
  });

  it("el código solo admite letras, números, guion y guion bajo, hasta 32", () => {
    expect(limpiarCodigo("  AB-12_cd/../x?y=1 ")).toBe("AB-12_cdxy1");
    expect(limpiarCodigo("x".repeat(100))).toHaveLength(32);
    expect(limpiarCodigo(42)).toBe("");
  });

  it("el origen personalizado se reduce a `https://dominio[:puerto]` y rechaza lo demás", () => {
    expect(normalizarOrigen("https://lumina.edu/clases/uno?x=1")).toBe("https://lumina.edu");
    expect(normalizarOrigen("http://localhost:3000/")).toBe("http://localhost:3000");
    expect(normalizarOrigen("javascript:alert(1)")).toBeNull();
    expect(normalizarOrigen("ftp://x.edu")).toBeNull();
    expect(normalizarOrigen("no es una url")).toBeNull();
    expect(normalizarOrigen("")).toBeNull();
  });
});

describe("render con y sin código", () => {
  it("con código: dibuja el QR de la URL de la página, con el código en texto grande", async () => {
    const { container } = render(<Viewer estado={con({ codigo: "AB12CD" })} config={{}} />);
    const svg = await screen.findByTestId("qr");
    expect(svg.getAttribute("data-value")).toBe(`${origenPagina()}/join/AB12CD`);
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain("AB12CD");
    expect(container.querySelector('[aria-label="Código: AB12CD"]')?.textContent).toBe("AB12CD");
    expect(screen.getByRole("region", { name: /Código QR para unirse/ })).toBeTruthy();
    expect(container.textContent).toContain("Escanea para unirte a la clase");
  });

  it("sin código: no hay QR, y el aviso depende de si es el editor o el visor", () => {
    const v = render(<Viewer estado={con()} config={{}} />);
    expect(screen.queryByTestId("qr")).toBeNull();
    expect(screen.getByRole("note").textContent).toBe("Falta el código de la clase.");
    expect(screen.queryByRole("button", { name: /Copiar/ })).toBeNull();
    v.unmount();
    render(<Editor estado={con()} config={{}} onChange={() => undefined} />);
    expect(screen.getByRole("note").textContent).toContain("Escribe el código de la clase en el panel");
  });

  it("origen personalizado: la URL usa esa dirección; si es inválido, vuelve a la de la página", async () => {
    const a = render(<Viewer estado={con({ codigo: "X1", origen: "personalizado", origenPersonalizado: "https://clase.edu/ruta" })} config={{}} />);
    expect((await screen.findByTestId("qr")).getAttribute("data-value")).toBe("https://clase.edu/join/X1");
    a.unmount();
    render(<Viewer estado={con({ codigo: "X1", origen: "personalizado", origenPersonalizado: "javascript:1" })} config={{}} />);
    expect((await screen.findByTestId("qr")).getAttribute("data-value")).toBe(`${origenPagina()}/join/X1`);
  });

  it("muestra el enlace y oculta el código solo si se pide", () => {
    const { container } = render(<Viewer estado={con({ codigo: "AB12", mostrarUrl: true, mostrarCodigo: false })} config={{}} />);
    expect(container.textContent).toContain(`${origenPagina()}/join/AB12`);
    expect(container.querySelector('[aria-label="Código: AB12"]')).toBeNull();
  });

  it("la miniatura no muestra botones de copiar", () => {
    render(<Viewer estado={con({ codigo: "AB12" })} config={{ isThumbnail: true }} />);
    expect(screen.queryByRole("button", { name: /Copiar/ })).toBeNull();
  });
});

describe("opciones del QR", () => {
  it("pasa el nivel de corrección, el margen y el tamaño relativo", async () => {
    const { container } = render(<Viewer estado={con({ codigo: "A1", nivel: "H", margen: 5, tamano: "grande" })} config={{}} />);
    await screen.findByTestId("qr");
    const props = qr.llamadas.at(-1)!;
    expect(props.level).toBe("H");
    expect(props.marginSize).toBe(5);
    expect((container.querySelector('[role="img"]') as HTMLElement).style.getPropertyValue("--qr-ancho")).toBe("100%");
  });

  it("contraste alto: negro sobre blanco; tema: el color del texto y fondo transparente", async () => {
    const a = render(<Viewer estado={con({ codigo: "A1", contraste: "alto" })} config={{}} />);
    await screen.findByTestId("qr");
    expect(qr.llamadas.at(-1)).toMatchObject({ fgColor: "#000000", bgColor: "#ffffff" });
    a.unmount();
    render(<Viewer estado={con({ codigo: "A1", contraste: "tema" })} config={{}} />);
    await screen.findByTestId("qr");
    expect(qr.llamadas.at(-1)).toMatchObject({ fgColor: "currentColor", bgColor: "transparent" });
  });
});

describe("copiar", () => {
  it("copia el código y el enlace al portapapeles y lo anuncia", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const { container } = render(<Viewer estado={con({ codigo: "AB12CD" })} config={{}} />);
    const viva = () => (container.querySelector('[role="status"]') as HTMLElement).textContent;
    await screen.findByTestId("qr");
    fireEvent.click(screen.getByRole("button", { name: /Copiar código/ }));
    await waitFor(() => expect(viva()).toBe("Código copiado"));
    expect(writeText).toHaveBeenLastCalledWith("AB12CD");
    fireEvent.click(screen.getByRole("button", { name: /Copiar enlace/ }));
    await waitFor(() => expect(viva()).toBe("Enlace copiado"));
    expect(writeText).toHaveBeenLastCalledWith(`${origenPagina()}/join/AB12CD`);
  });

  it("sin `navigator.clipboard` usa el respaldo; si también falla, avisa", async () => {
    vi.stubGlobal("navigator", {});
    const exec = vi.fn().mockReturnValue(true);
    (document as unknown as { execCommand: unknown }).execCommand = exec;
    const { container } = render(<Viewer estado={con({ codigo: "AB12" })} config={{}} />);
    const viva = () => (container.querySelector('[role="status"]') as HTMLElement).textContent;
    fireEvent.click(screen.getByRole("button", { name: /Copiar código/ }));
    await waitFor(() => expect(viva()).toBe("Código copiado"));
    expect(exec).toHaveBeenCalledWith("copy");
    exec.mockReturnValue(false);
    fireEvent.click(screen.getByRole("button", { name: /Copiar código/ }));
    await waitFor(() => expect(viva()).toBe("No se pudo copiar"));
  });

  it("un permiso denegado no rompe: prueba el respaldo y avisa si falla", async () => {
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denegado")) } });
    (document as unknown as { execCommand: unknown }).execCommand = vi.fn().mockReturnValue(false);
    const { container } = render(<Viewer estado={con({ codigo: "AB12" })} config={{}} />);
    fireEvent.click(screen.getByRole("button", { name: /Copiar enlace/ }));
    await waitFor(() => expect((container.querySelector('[role="status"]') as HTMLElement).textContent).toBe("No se pudo copiar"));
  });

  it("en el editor los botones no copian", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(<Editor estado={con({ codigo: "AB12" })} config={{}} onChange={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: /Copiar código/ }));
    await new Promise((r) => setTimeout(r, 20));
    expect(writeText).not.toHaveBeenCalled();
  });

  it("sin botones configurados no existen", () => {
    render(<Viewer estado={con({ codigo: "AB12", botonCopiar: false })} config={{}} />);
    expect(screen.queryByRole("button", { name: /Copiar/ })).toBeNull();
  });
});

describe("editor", () => {
  it("un clic selecciona el bloque", () => {
    const seleccionar = vi.fn();
    render(<Editor estado={con({ codigo: "AB12" })} config={{ onEnsureBlockSelected: seleccionar }} onChange={() => undefined} />);
    fireEvent.pointerDown(screen.getByRole("region"));
    expect(seleccionar).toHaveBeenCalled();
  });
});

describe("normalización de JSON incompleto", () => {
  it("un bloque vacío recibe los valores por defecto (sin código)", () => {
    const n = normalizeQrSesionWidget({});
    expect(n.tipo).toBe("qr-sesion");
    expect(n.configuracion).toMatchObject({ codigo: "", origen: "automatico", nivel: "M", tamano: "mediano", contraste: "alto", mostrarCodigo: true, botonCopiar: true });
  });

  it("valores desconocidos vuelven al defecto; margen y textos se acotan; código y dirección se sanean", () => {
    const n = normalizeQrSesionWidget({
      configuracion: { codigo: "../../etc?", origen: "personalizado", origenPersonalizado: "ftp://x", nivel: "Z", tamano: "enorme", contraste: 1, margen: 99, textoAyuda: "x".repeat(300) } as unknown,
    });
    expect(n.configuracion).toMatchObject({ codigo: "etc", origen: "personalizado", origenPersonalizado: "", nivel: "M", tamano: "mediano", contraste: "alto", margen: 8 });
    expect(n.configuracion.textoAyuda).toHaveLength(80);
  });

  it("el visor no se rompe con un bloque sin configuración", () => {
    const roto = { tipo: "qr-sesion", x: 1, y: 1, ancho: 10, alto: 10 } as unknown as QrSesionEstado;
    expect(() => render(<Viewer estado={roto} config={{}} />)).not.toThrow();
  });
});

describe("panel de propiedades", () => {
  const abrir = (estado: QrSesionEstado, onChange = vi.fn()) => {
    render(<Props estado={estado} config={{}} onChange={onChange} onConfigChange={() => undefined} />);
    return onChange;
  };

  it("el código se limpia al escribirlo y se muestra el enlace resultante", () => {
    const onChange = abrir(con());
    fireEvent.change(screen.getByLabelText("Código"), { target: { value: " ab 12/x " } });
    expect(onChange.mock.calls[0][0].configuracion.codigo).toBe("ab12x");
    expect(screen.getByTestId("qr-ejemplo").textContent).toContain("/join/CODIGO");
  });

  it("aclara que el código es manual y que quien vea el slide podrá unirse", () => {
    abrir(con());
    expect(document.body.textContent).toContain("Escríbelo a mano");
    expect(document.body.textContent).toContain("Quien vea este slide podrá unirse");
  });

  it("tamaño, nivel y colores se eligen con botones accesibles", () => {
    const onChange = abrir(con());
    fireEvent.click(screen.getByRole("button", { name: "Grande" }));
    expect(onChange.mock.calls[0][0].configuracion.tamano).toBe("grande");
    fireEvent.click(screen.getByRole("button", { name: /^Nivel H/ }));
    expect(onChange.mock.calls[1][0].configuracion.nivel).toBe("H");
    fireEvent.click(screen.getByRole("button", { name: "Colores del tema" }));
    expect(onChange.mock.calls[2][0].configuracion.contraste).toBe("tema");
  });

  it("una dirección personalizada inválida se avisa y se guarda vacía", () => {
    const onChange = abrir(con({ origen: "personalizado", origenPersonalizado: "" }));
    expect(screen.getByText(/Escribe una dirección http\(s\) válida/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Dirección del sitio"), { target: { value: "https://clase.edu/ruta" } });
    expect(onChange.mock.calls[0][0].configuracion.origenPersonalizado).toBe("https://clase.edu");
    fireEvent.change(screen.getByLabelText("Dirección del sitio"), { target: { value: "javascript:1" } });
    expect(onChange.mock.calls[1][0].configuracion.origenPersonalizado).toBe("");
  });
});

describe("presets", () => {
  it("existen, con ids únicos, y no tocan el código", () => {
    const ids = QR_SESION_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    const base = con({ codigo: "MIO123" });
    for (const p of QR_SESION_PRESETS) expect(aplicarPreset(base, p).configuracion.codigo).toBe("MIO123");
  });

  it("«para proyector» agranda y sube la corrección", () => {
    const p = QR_SESION_PRESETS.find((x) => x.id === "proyector")!;
    expect(aplicarPreset(con(), p).configuracion).toMatchObject({ tamano: "grande", nivel: "Q" });
  });
});
