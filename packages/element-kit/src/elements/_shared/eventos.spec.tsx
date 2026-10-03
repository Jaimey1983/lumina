// K3 — canal de eventos: los elementos avisan al motor por `config.emitir` y,
// SIN él, se comportan exactamente como antes (la paridad de DOM y de acciones
// legacy la siguen cubriendo los `*.parity.spec.tsx` de cada elemento).
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import type { EventoTipo } from "@lumina/types/interaction";
import { SlideNavContext, type SlideNavAction } from "../../widgets/boton/index.js";
import { botonDefinition } from "../boton/boton-definition.js";
import { contadorDefinition } from "../contador/contador-definition.js";
import { hotspotDefinition } from "../hotspot/hotspot-definition.js";
import { audioDefinition } from "../audio/audio-definition.js";
import { videoDefinition } from "../video/video-definition.js";
import { createDefaultAudioBlock } from "../../blocks/audio/index.js";
import { createDefaultVideoBlock } from "../../blocks/video/index.js";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const espia = () => {
  const emitir = vi.fn<(evento: EventoTipo) => void>();
  return { emitir, eventos: () => emitir.mock.calls.map(([e]) => e) };
};

function ConNav({
  navigate,
  children,
}: {
  navigate: ((a: SlideNavAction) => void) | null;
  children: ReactNode;
}) {
  return createElement(
    SlideNavContext.Provider,
    { value: { navigate, slideCount: 5, slideIndex: 1 } },
    children,
  );
}

describe("declaración de eventos en el contrato", () => {
  it("cada elemento declara los eventos que emite", () => {
    expect(botonDefinition.eventos).toEqual(["clic", "hover_entra", "hover_sale"]);
    expect(hotspotDefinition.eventos).toEqual(["clic", "visitado", "hover_entra", "hover_sale"]);
    expect(contadorDefinition.eventos).toEqual(["fin_contador", "hover_entra", "hover_sale"]);
  });
});

describe("Botón", () => {
  const boton = (extra: object = {}) => ({
    ...botonDefinition.crearPorDefecto(),
    ...extra,
  });
  const Viewer = botonDefinition.Viewer;

  it("emite `clic` al activarse (acción ninguna)", () => {
    const { emitir, eventos } = espia();
    const { container } = render(
      <Viewer estado={boton({ accion: "ninguna" })} config={{ emitir }} />,
    );
    fireEvent.click(container.querySelector("button") as HTMLElement);
    expect(eventos()).toEqual(["clic"]);
  });

  it("con `emitir` solo emite `clic`: la navegación la decide el motor (K4), no el botón", () => {
    const { emitir, eventos } = espia();
    const navigate = vi.fn();
    const { container } = render(
      <ConNav navigate={navigate}>
        <Viewer estado={boton({ accion: "siguiente" })} config={{ emitir }} />
      </ConNav>,
    );
    fireEvent.click(container.querySelector("button") as HTMLElement);
    expect(eventos()).toEqual(["clic"]);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("acción `url`: el clic en el enlace también emite `clic`", () => {
    const { emitir, eventos } = espia();
    const { container } = render(
      <Viewer
        estado={boton({ accion: "url", url: "https://example.com" })}
        config={{ emitir }}
      />,
    );
    const enlace = container.querySelector("a") as HTMLAnchorElement;
    expect(enlace.getAttribute("href")).toBe("https://example.com");
    fireEvent.click(enlace);
    expect(eventos()).toEqual(["clic"]);
  });

  it("NO emite si está en miniatura, deshabilitado o bloqueado por la clase en vivo", () => {
    const miniatura = espia();
    const a = render(
      <Viewer estado={boton()} config={{ emitir: miniatura.emitir, isThumbnail: true }} />,
    );
    fireEvent.click(a.container.querySelector("button") as HTMLElement);
    a.unmount();

    const off = espia();
    const b = render(
      <Viewer estado={boton({ deshabilitado: true })} config={{ emitir: off.emitir }} />,
    );
    fireEvent.click(b.container.querySelector("button") as HTMLElement);
    b.unmount();

    // En vivo `navigate` es null y un botón de navegación queda deshabilitado (D1).
    const vivo = espia();
    const c = render(
      <ConNav navigate={null}>
        <Viewer estado={boton({ accion: "siguiente" })} config={{ emitir: vivo.emitir }} />
      </ConNav>,
    );
    fireEvent.click(c.container.querySelector("button") as HTMLElement);

    expect(miniatura.emitir).not.toHaveBeenCalled();
    expect(off.emitir).not.toHaveBeenCalled();
    expect(vivo.emitir).not.toHaveBeenCalled();
  });

  it("sin `emitir` no pasa nada raro: navega igual que antes", () => {
    const navigate = vi.fn();
    const { container } = render(
      <ConNav navigate={navigate}>
        <Viewer estado={boton({ accion: "anterior" })} config={{}} />
      </ConNav>,
    );
    fireEvent.click(container.querySelector("button") as HTMLElement);
    expect(navigate).toHaveBeenCalledWith({ kind: "anterior" });
  });
});

describe("Hotspot", () => {
  const Viewer = hotspotDefinition.Viewer;
  const marcador = (c: HTMLElement) =>
    c.querySelector('[class*="markerWrapper"]') as HTMLElement;

  it("primer clic: `clic` y `visitado`; cerrar y reabrir: solo `clic` (visitado una vez)", () => {
    const { emitir, eventos } = espia();
    const { container } = render(
      <Viewer estado={hotspotDefinition.crearPorDefecto()} config={{ emitir }} />,
    );
    fireEvent.click(marcador(container)); // abre
    expect(eventos()).toEqual(["clic", "visitado"]);
    fireEvent.click(marcador(container)); // cierra
    fireEvent.click(marcador(container)); // reabre
    expect(eventos()).toEqual(["clic", "visitado", "clic", "clic"]);
  });

  it("si el motor ya lo marcó `visitado` no vuelve a emitir `visitado`", () => {
    const { emitir, eventos } = espia();
    const { container } = render(
      <Viewer
        estado={hotspotDefinition.crearPorDefecto()}
        config={{ emitir, estadoObjeto: "visitado" }}
      />,
    );
    fireEvent.click(marcador(container));
    expect(eventos()).toEqual(["clic"]);
  });

  it("con disparador `hover` emite `visitado` pero NO `clic`", () => {
    const base = hotspotDefinition.crearPorDefecto();
    const estado = {
      ...base,
      configuracion: { ...base.configuracion, triggerEvento: "hover" as const },
    };
    const { emitir, eventos } = espia();
    const { container } = render(<Viewer estado={estado} config={{ emitir }} />);
    fireEvent.pointerEnter(container.querySelector('[class*="hotspotRoot"]') as HTMLElement);
    expect(eventos()).toEqual(["visitado"]);
  });

  it("en miniatura no emite nada", () => {
    const { emitir } = espia();
    const { container } = render(
      <Viewer
        estado={hotspotDefinition.crearPorDefecto()}
        config={{ emitir, isThumbnail: true }}
      />,
    );
    fireEvent.click(marcador(container));
    expect(emitir).not.toHaveBeenCalled();
  });

  it("sin `emitir` el hotspot abre y cierra como siempre (no revienta)", () => {
    const { container } = render(
      <Viewer estado={hotspotDefinition.crearPorDefecto()} config={{}} />,
    );
    expect(() => {
      fireEvent.click(marcador(container));
      fireEvent.click(marcador(container));
    }).not.toThrow();
  });
});

describe("Contador", () => {
  const Viewer = contadorDefinition.Viewer;
  const temporizador = (extra: object = {}) => ({
    ...contadorDefinition.crearPorDefecto(),
    modo: "temporizador" as const,
    segundos: 1,
    autoIniciar: true,
    ...extra,
  });
  const avanzar = (ms: number) =>
    act(() => {
      vi.advanceTimersByTime(ms);
    });
  const usarRelojFalso = () =>
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "performance", "Date"],
    });

  it("emite `fin_contador` UNA vez cuando el temporizador llega a cero", () => {
    usarRelojFalso();
    const { emitir, eventos } = espia();
    render(<Viewer estado={temporizador()} config={{ emitir }} />);
    avanzar(500);
    expect(eventos()).toEqual([]);
    avanzar(1500);
    expect(eventos()).toEqual(["fin_contador"]);
    avanzar(5000);
    expect(eventos()).toEqual(["fin_contador"]);
  });

  it("el cronómetro y el modo número no emiten `fin_contador`", () => {
    usarRelojFalso();
    const { emitir } = espia();
    render(<Viewer estado={temporizador({ modo: "cronometro" })} config={{ emitir }} />);
    render(<Viewer estado={temporizador({ modo: "numero" })} config={{ emitir }} />);
    avanzar(5000);
    expect(emitir).not.toHaveBeenCalled();
  });

  it("en miniatura no corre ni emite", () => {
    usarRelojFalso();
    const { emitir } = espia();
    render(<Viewer estado={temporizador()} config={{ emitir, isThumbnail: true }} />);
    avanzar(5000);
    expect(emitir).not.toHaveBeenCalled();
  });

  it("sin `emitir` el temporizador termina y navega con `alTerminar` como antes", () => {
    usarRelojFalso();
    const navigate = vi.fn();
    render(
      <ConNav navigate={navigate}>
        <Viewer estado={temporizador({ alTerminar: "siguiente" })} config={{}} />
      </ConNav>,
    );
    avanzar(2000);
    expect(navigate).toHaveBeenCalledWith({ kind: "siguiente" });
  });

  it("con `emitir` y `alTerminar: siguiente` solo emite `fin_contador` (el motor navega, K4)", () => {
    usarRelojFalso();
    const navigate = vi.fn();
    const { emitir, eventos } = espia();
    render(
      <ConNav navigate={navigate}>
        <Viewer estado={temporizador({ alTerminar: "siguiente" })} config={{ emitir }} />
      </ConNav>,
    );
    avanzar(2000);
    expect(eventos()).toEqual(["fin_contador"]);
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe("N5: audio y video emiten media_inicia / media_termina", () => {
  it("declaran los eventos de media", () => {
    expect(audioDefinition.eventos).toContain("media_inicia");
    expect(audioDefinition.eventos).toContain("media_termina");
    expect(videoDefinition.eventos).toContain("media_termina");
  });

  it("audio: play emite media_inicia UNA vez por reproducción y ended emite media_termina", () => {
    const { emitir, eventos } = espia();
    const Viewer = audioDefinition.Viewer;
    const { container } = render(
      createElement(Viewer, { estado: createDefaultAudioBlock({ url: "https://e.test/a.mp3" }), config: { emitir } }),
    );
    const el = container.querySelector("audio") as HTMLAudioElement;
    fireEvent.play(el);
    fireEvent.play(el); // pausar y reanudar no repite
    expect(eventos()).toEqual(["media_inicia"]);
    fireEvent.ended(el);
    expect(eventos()).toEqual(["media_inicia", "media_termina"]);
    fireEvent.play(el); // una reproducción nueva sí emite
    expect(eventos()).toEqual(["media_inicia", "media_termina", "media_inicia"]);
  });

  it("video nativo: play/ended emiten; en miniatura o sin emitir no emite nada", () => {
    const { emitir, eventos } = espia();
    const Viewer = videoDefinition.Viewer;
    const estado = createDefaultVideoBlock({ url: "https://e.test/v.mp4" });
    const { container } = render(createElement(Viewer, { estado, config: { emitir } }));
    const el = container.querySelector("video") as HTMLVideoElement;
    fireEvent.play(el);
    fireEvent.ended(el);
    expect(eventos()).toEqual(["media_inicia", "media_termina"]);

    cleanup();
    const sin = render(createElement(Viewer, { estado, config: {} }));
    const v2 = sin.container.querySelector("video") as HTMLVideoElement;
    expect(() => {
      fireEvent.play(v2);
      fireEvent.ended(v2);
    }).not.toThrow();
    expect(eventos()).toEqual(["media_inicia", "media_termina"]); // sin cambios
  });
});
