import type { ReactElement } from "react";
import type { ElementPropsPanelProps } from "@lumina/element-kit-core";
import type {
  ScratchCardConfig,
  ScratchCardEstado,
  ScratchContenidoTipo,
} from "./scratch-card-types.js";
import { SCRATCH_CARD_PRESETS } from "./scratch-card-presets.js";

export function ScratchCardPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<ScratchCardEstado, ScratchCardConfig>): ReactElement {
  const cfg = estado.configuracion;

  const updateConfig = (
    patch: Partial<ScratchCardEstado["configuracion"]>,
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
    const preset = SCRATCH_CARD_PRESETS.find((p) => p.id === presetId);
    if (!preset?.patch?.configuracion) return;
    updateConfig(preset.patch.configuracion);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        padding: "12px 4px",
      }}
    >
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
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}
        >
          {SCRATCH_CARD_PRESETS.map((preset) => (
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

      {/* Tipo de contenido secreto */}
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
          Tipo de Contenido Oculto
        </label>
        <select
          value={cfg.contenidoTipo}
          onChange={(e) =>
            updateConfig({
              contenidoTipo: e.target.value as ScratchContenidoTipo,
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
          <option value="texto">Texto / Respuesta Oculta</option>
          <option value="imagen">Imagen / Fotografía</option>
          <option value="premio">Insignia / Premio / Recompensa</option>
        </select>
      </div>

      {/* Campos según tipo */}
      {cfg.contenidoTipo === "texto" && (
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
            Texto Secreto
          </label>
          <textarea
            rows={3}
            value={cfg.textoSecreto ?? ""}
            onChange={(e) => updateConfig({ textoSecreto: e.target.value })}
            placeholder="Escribe la respuesta o dato oculto..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "6px 8px",
              fontSize: "12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontFamily: "inherit",
            }}
          />
        </div>
      )}

      {cfg.contenidoTipo === "imagen" && (
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
            URL de la Imagen Oculta
          </label>
          <input
            type="text"
            value={cfg.imagenSecretaUrl ?? ""}
            onChange={(e) => updateConfig({ imagenSecretaUrl: e.target.value })}
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
      )}

      {cfg.contenidoTipo === "premio" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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
              Título del Premio
            </label>
            <input
              type="text"
              value={cfg.premioTitulo ?? ""}
              onChange={(e) => updateConfig({ premioTitulo: e.target.value })}
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
              Subtítulo / Puntos
            </label>
            <input
              type="text"
              value={cfg.premioSubtitulo ?? ""}
              onChange={(e) =>
                updateConfig({ premioSubtitulo: e.target.value })
              }
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
      )}

      <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: 0 }} />

      {/* Cobertura */}
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
          Texto sobre la Cobertura
        </label>
        <input
          type="text"
          value={cfg.textoCobertura}
          onChange={(e) => updateConfig({ textoCobertura: e.target.value })}
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
            Color Cobertura
          </label>
          <input
            type="color"
            value={cfg.colorCobertura}
            onChange={(e) => updateConfig({ colorCobertura: e.target.value })}
            style={{
              width: "100%",
              height: "32px",
              padding: "2px",
              borderRadius: "4px",
              border: "1px solid #cbd5e1",
              cursor: "pointer",
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
            Pincel ({cfg.grosorPincel}px)
          </label>
          <input
            type="range"
            min={16}
            max={64}
            value={cfg.grosorPincel}
            onChange={(e) =>
              updateConfig({ grosorPincel: Number(e.target.value) })
            }
            style={{ width: "100%", accentColor: "#2563eb" }}
          />
        </div>
      </div>

      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "4px",
          }}
        >
          <label
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#334155",
            }}
          >
            Auto-revelar al alcanzar
          </label>
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            {cfg.umbralAutoRevelado}%
          </span>
        </div>
        <input
          type="range"
          min={20}
          max={80}
          value={cfg.umbralAutoRevelado}
          onChange={(e) =>
            updateConfig({ umbralAutoRevelado: Number(e.target.value) })
          }
          style={{ width: "100%", accentColor: "#2563eb" }}
        />
      </div>

      {/* Switches */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            color: "#334155",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={cfg.permitirBotonRevelar}
            onChange={(e) =>
              updateConfig({ permitirBotonRevelar: e.target.checked })
            }
          />
          Mostrar botón "Revelar todo"
        </label>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            color: "#334155",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={cfg.permitirReinicio}
            onChange={(e) =>
              updateConfig({ permitirReinicio: e.target.checked })
            }
          />
          Mostrar botón "Rascar de nuevo"
        </label>
      </div>
    </div>
  );
}
