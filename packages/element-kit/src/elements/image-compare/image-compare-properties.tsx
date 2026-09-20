import type { ReactElement } from "react";
import type { ElementPropsPanelProps } from "@lumina/element-kit-core";
import type {
  ImageCompareConfig,
  ImageCompareEstado,
} from "./image-compare-types.js";
import { IMAGE_COMPARE_PRESETS } from "./image-compare-presets.js";

export function ImageComparePropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<ImageCompareEstado, ImageCompareConfig>): ReactElement {
  const cfg = estado.configuracion;

  const updateConfig = (
    patch: Partial<ImageCompareEstado["configuracion"]>,
  ) => {
    onChange({
      ...estado,
      configuracion: {
        ...cfg,
        ...patch,
      },
    });
  };

  const applyPreset = (presetId: string) => {
    const preset = IMAGE_COMPARE_PRESETS.find((p) => p.id === presetId);
    if (!preset?.patch?.configuracion) return;
    updateConfig(preset.patch.configuracion);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "12px 4px" }}>
      {/* Sección Presets */}
      <div>
        <label
          style={{
            display: "block",
            fontSize: "12px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "#64748b",
            marginBottom: "8px",
          }}
        >
          Plantillas / Presets
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          {IMAGE_COMPARE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              style={{
                padding: "6px 8px",
                fontSize: "11px",
                fontWeight: 500,
                textAlign: "left",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: 0 }} />

      {/* Imagen Antes */}
      <div>
        <label
          style={{
            display: "block",
            fontSize: "12px",
            fontWeight: 600,
            color: "#334155",
            marginBottom: "4px",
          }}
        >
          URL Imagen Antes (Izquierda/Arriba)
        </label>
        <input
          type="text"
          value={cfg.imagenAntesUrl}
          onChange={(e) => updateConfig({ imagenAntesUrl: e.target.value })}
          placeholder="https://..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "6px 8px",
            fontSize: "12px",
            borderRadius: "6px",
            border: "1px solid #cbd5e1",
          }}
        />
      </div>

      {/* Imagen Después */}
      <div>
        <label
          style={{
            display: "block",
            fontSize: "12px",
            fontWeight: 600,
            color: "#334155",
            marginBottom: "4px",
          }}
        >
          URL Imagen Después (Derecha/Abajo)
        </label>
        <input
          type="text"
          value={cfg.imagenDespuesUrl}
          onChange={(e) => updateConfig({ imagenDespuesUrl: e.target.value })}
          placeholder="https://..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "6px 8px",
            fontSize: "12px",
            borderRadius: "6px",
            border: "1px solid #cbd5e1",
          }}
        />
      </div>

      <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: 0 }} />

      {/* Etiquetas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <div>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 600,
              color: "#334155",
              marginBottom: "4px",
            }}
          >
            Etiqueta Antes
          </label>
          <input
            type="text"
            value={cfg.etiquetaAntes}
            onChange={(e) => updateConfig({ etiquetaAntes: e.target.value })}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "6px 8px",
              fontSize: "12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
            }}
          />
        </div>
        <div>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 600,
              color: "#334155",
              marginBottom: "4px",
            }}
          >
            Etiqueta Después
          </label>
          <input
            type="text"
            value={cfg.etiquetaDespues}
            onChange={(e) => updateConfig({ etiquetaDespues: e.target.value })}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "6px 8px",
              fontSize: "12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
            }}
          />
        </div>
      </div>

      {/* Orientación */}
      <div>
        <label
          style={{
            display: "block",
            fontSize: "12px",
            fontWeight: 600,
            color: "#334155",
            marginBottom: "4px",
          }}
        >
          Orientación
        </label>
        <select
          value={cfg.orientacion}
          onChange={(e) =>
            updateConfig({
              orientacion: e.target.value as "horizontal" | "vertical",
            })
          }
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "6px 8px",
            fontSize: "12px",
            borderRadius: "6px",
            border: "1px solid #cbd5e1",
            background: "#ffffff",
          }}
        >
          <option value="horizontal">Horizontal (Izquierda / Derecha)</option>
          <option value="vertical">Vertical (Arriba / Abajo)</option>
        </select>
      </div>

      {/* Posición Inicial */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <label
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#334155",
            }}
          >
            Posición Inicial
          </label>
          <span style={{ fontSize: "12px", color: "#64748b" }}>{cfg.posicionInicial}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={cfg.posicionInicial}
          onChange={(e) => updateConfig({ posicionInicial: Number(e.target.value) })}
          style={{ width: "100%", accentColor: "#2563eb" }}
        />
      </div>

      {/* Opciones booleanas */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#334155", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={cfg.mostrarEtiquetas}
            onChange={(e) => updateConfig({ mostrarEtiquetas: e.target.checked })}
          />
          Mostrar etiquetas flotantes
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#334155", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={cfg.mostrarBotonDeslizador}
            onChange={(e) => updateConfig({ mostrarBotonDeslizador: e.target.checked })}
          />
          Mostrar tirador en el divisor
        </label>
      </div>
    </div>
  );
}
