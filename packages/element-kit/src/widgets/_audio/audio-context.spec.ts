import { afterEach, describe, expect, it, vi } from "vitest";
import { obtenerAudioContextCtor } from "./audio-context.js";

describe("obtenerAudioContextCtor", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("devuelve null sin WebAudio", () => {
    vi.stubGlobal("AudioContext", undefined);
    vi.stubGlobal("webkitAudioContext", undefined);
    expect(obtenerAudioContextCtor()).toBeNull();
  });

  it("prefiere AudioContext y cae a webkitAudioContext", () => {
    class Estandar {}
    class Webkit {}
    vi.stubGlobal("AudioContext", Estandar);
    vi.stubGlobal("webkitAudioContext", Webkit);
    expect(obtenerAudioContextCtor()).toBe(Estandar);
    vi.stubGlobal("AudioContext", undefined);
    expect(obtenerAudioContextCtor()).toBe(Webkit);
  });
});
