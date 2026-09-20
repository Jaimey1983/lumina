import type { ReactElement } from "react";
import type { ElementPropsPanelProps } from "@lumina/element-kit-core";
import type {
  ChecklistConfig,
  ChecklistEstado,
  ChecklistItem,
} from "./checklist-types.js";
import { CHECKLIST_PRESETS } from "./checklist-presets.js";

export function ChecklistPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<ChecklistEstado, ChecklistConfig>): ReactElement {
  const cfg = estado.configuracion;
  const items = cfg.items ?? [];

  const updateConfig = (patch: Partial<ChecklistEstado["configuracion"]>) => {
    onChange({
      ...estado,
      configuracion: {
        ...cfg,
        ...patch,
      },
    });
  };

  const applyPreset = (presetId: string) => {
    const preset = CHECKLIST_PRESETS.find((p) => p.id === presetId);
    if (!preset?.patch?.configuracion) return;
    updateConfig(preset.patch.configuracion);
  };

  const addItem = () => {
    const newItem: ChecklistItem = {
      id: `item-${Date.now()}`,
      texto: `Paso ${items.length + 1}`,
      descripcion: "",
      completadoPorDefecto: false,
    };
    updateConfig({ items: [...items, newItem] });
  };

  const removeItem = (id: string) => {
    updateConfig({ items: items.filter((item) => item.id !== id) });
  };

  const updateItem = (id: string, patch: Partial<ChecklistItem>) => {
    updateConfig({
      items: items.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
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
          {CHECKLIST_PRESETS.map((preset) => (
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

      {/* Estilo Visual */}
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
          Estilo Visual
        </label>
        <select
          value={cfg.estiloVisual}
          onChange={(e) =>
            updateConfig({
              estiloVisual: e.target.value as "tarjetas" | "minimal" | "numerado",
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
          <option value="tarjetas">Tarjetas Destacadas</option>
          <option value="numerado">Pasos Numerados</option>
          <option value="minimal">Minimalista (Compacto)</option>
        </select>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: 0 }} />

      {/* Lista de Ítems */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <label
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#334155",
            }}
          >
            Elementos de la Lista ({items.length})
          </label>
          <button
            type="button"
            onClick={addItem}
            style={{
              padding: "4px 8px",
              fontSize: "11px",
              fontWeight: 600,
              borderRadius: "4px",
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              cursor: "pointer",
            }}
          >
            + Agregar
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {items.map((item, index) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
              }}
            >
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    width: "16px",
                  }}
                >
                  {index + 1}.
                </span>
                <input
                  type="text"
                  value={item.texto}
                  onChange={(e) =>
                    updateItem(item.id, { texto: e.target.value })
                  }
                  placeholder="Texto del paso..."
                  style={{
                    flex: 1,
                    padding: "4px 6px",
                    fontSize: "12px",
                    borderRadius: "4px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Eliminar ítem ${index + 1}`}
                  style={{
                    padding: "4px 6px",
                    fontSize: "11px",
                    color: "#ef4444",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                value={item.descripcion ?? ""}
                onChange={(e) =>
                  updateItem(item.id, { descripcion: e.target.value })
                }
                placeholder="Descripción o pista adicional (opcional)..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "4px 6px",
                  fontSize: "11px",
                  color: "#64748b",
                  borderRadius: "4px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: 0 }} />

      {/* Opciones de presentación */}
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
            checked={cfg.mostrarBarraProgreso}
            onChange={(e) =>
              updateConfig({ mostrarBarraProgreso: e.target.checked })
            }
          />
          Mostrar barra de progreso animada
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
            checked={cfg.mostrarContador}
            onChange={(e) => updateConfig({ mostrarContador: e.target.checked })}
          />
          Mostrar contador numérico y porcentaje
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
            checked={cfg.mostrarCelebracion}
            onChange={(e) =>
              updateConfig({ mostrarCelebracion: e.target.checked })
            }
          />
          Mostrar mensaje de felicitación al completar
        </label>
      </div>
    </div>
  );
}
