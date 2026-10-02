import { useState, type ReactElement } from "react";
import type { ElementPropsPanelProps } from "@lumina/element-kit-core";
import { Checkbox } from "@lumina/ui/checkbox";
import { Input } from "@lumina/ui/input";
import { Label } from "@lumina/ui/label";
import { Button } from "@lumina/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@lumina/ui/select";
import { WidgetSectionTitle } from "@lumina/editor-shared/widget-properties-panel";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type {
  AccordionConfig,
  AccordionConfiguracion,
  AccordionEstiloVisual,
  AccordionEstado,
  AccordionModo,
  AccordionPosicionIcono,
  AccordionSeccion,
  AccordionTamanoIcono,
} from "./accordion-types.js";
import { ACCORDION_PRESETS } from "./accordion-presets.js";

export function AccordionPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<AccordionEstado, AccordionConfig>): ReactElement {
  const cfg = estado.configuracion;
  const secciones = cfg.secciones ?? [];

  const [seccionExpandidaId, setSeccionExpandidaId] = useState<string | null>(
    secciones[0]?.id ?? null,
  );

  const updateConfig = (patch: Partial<AccordionConfiguracion>) => {
    onChange({
      ...estado,
      configuracion: {
        ...cfg,
        ...patch,
      },
    });
  };

  const applyPreset = (presetId: string) => {
    const preset = ACCORDION_PRESETS.find((p) => p.id === presetId);
    if (!preset?.patch) return;

    onChange({
      ...estado,
      ...(preset.patch.tituloWidget !== undefined && {
        tituloWidget: preset.patch.tituloWidget,
      }),
      ...(preset.patch.subtituloWidget !== undefined && {
        subtituloWidget: preset.patch.subtituloWidget,
      }),
      ...(preset.patch.instruccion !== undefined && {
        instruccion: preset.patch.instruccion,
      }),
      configuracion: {
        ...cfg,
        ...(preset.patch as { configuracion?: Partial<AccordionConfiguracion> })
          .configuracion,
      },
    });
  };

  const agregarSeccion = () => {
    const nuevaId = `sec-${Date.now()}`;
    const nuevaSeccion: AccordionSeccion = {
      id: nuevaId,
      titulo: `Sección ${secciones.length + 1}`,
      contenido: "Escribe aquí la información correspondiente a esta sección.",
      abiertoPorDefecto: false,
    };
    updateConfig({ secciones: [...secciones, nuevaSeccion] });
    setSeccionExpandidaId(nuevaId);
  };

  const eliminarSeccion = (id: string) => {
    updateConfig({ secciones: secciones.filter((s) => s.id !== id) });
    if (seccionExpandidaId === id) {
      setSeccionExpandidaId(null);
    }
  };

  const actualizarSeccion = (id: string, patch: Partial<AccordionSeccion>) => {
    updateConfig({
      secciones: secciones.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  };

  const moverSeccion = (index: number, direccion: -1 | 1) => {
    const destino = index + direccion;
    if (destino < 0 || destino >= secciones.length) return;
    const copia = [...secciones];
    const temp = copia[index];
    copia[index] = copia[destino];
    copia[destino] = temp;
    updateConfig({ secciones: copia });
  };

  return (
    <div className="flex flex-col gap-6 p-1 text-xs">
      {/* ─── Presets ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <WidgetSectionTitle>Plantillas / Presets</WidgetSectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {ACCORDION_PRESETS.map((p) => (
            <Button
              key={p.id}
              variant="outline"
              size="sm"
              className="h-auto py-1.5 px-2 text-left text-[11px] font-normal leading-snug justify-start flex-col items-start whitespace-normal"
              onClick={() => applyPreset(p.id)}
            >
              <span className="font-semibold text-foreground">{p.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* ─── Estructura y Comportamiento ────────────────────────────── */}
      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <WidgetSectionTitle>Comportamiento y Modo</WidgetSectionTitle>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="acc-modo" className="text-[11px] text-muted-foreground">
            Modo de apertura
          </Label>
          <Select
            value={cfg.modo}
            onValueChange={(val) => updateConfig({ modo: val as AccordionModo })}
          >
            <SelectTrigger id="acc-modo" className="h-8 text-xs">
              <SelectValue placeholder="Selecciona modo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="exclusivo">Exclusivo (un panel a la vez)</SelectItem>
              <SelectItem value="multiple">Múltiple (varios abiertos)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="acc-colapsar-todo"
            checked={cfg.permitirColapsarTodo}
            onCheckedChange={(checked) =>
              updateConfig({ permitirColapsarTodo: Boolean(checked) })
            }
          />
          <Label htmlFor="acc-colapsar-todo" className="text-xs font-normal cursor-pointer">
            Permitir colapsar todos los paneles
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="acc-animacion"
            checked={cfg.animacionExpandir}
            onCheckedChange={(checked) =>
              updateConfig({ animacionExpandir: Boolean(checked) })
            }
          />
          <Label htmlFor="acc-animacion" className="text-xs font-normal cursor-pointer">
            Animación fluida al expandir
          </Label>
        </div>
      </div>

      {/* ─── Estilo Visual e Iconografía ─────────────────────────────── */}
      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <WidgetSectionTitle>Apariencia Visual</WidgetSectionTitle>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="acc-estilo" className="text-[11px] text-muted-foreground">
            Estilo de contenedor
          </Label>
          <Select
            value={cfg.estiloVisual}
            onValueChange={(val) =>
              updateConfig({ estiloVisual: val as AccordionEstiloVisual })
            }
          >
            <SelectTrigger id="acc-estilo" className="h-8 text-xs">
              <SelectValue placeholder="Estilo visual" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tarjetas">Tarjetas independientes</SelectItem>
              <SelectItem value="bordeado">Contenedor bordeado</SelectItem>
              <SelectItem value="separadores">Separadores limpios</SelectItem>
              <SelectItem value="minimal">Minimalista</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="acc-pos-icono" className="text-[11px] text-muted-foreground">
              Posición del chevron
            </Label>
            <Select
              value={cfg.posicionIcono}
              onValueChange={(val) =>
                updateConfig({ posicionIcono: val as AccordionPosicionIcono })
              }
            >
              <SelectTrigger id="acc-pos-icono" className="h-8 text-xs">
                <SelectValue placeholder="Posición" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="derecha">Derecha</SelectItem>
                <SelectItem value="izquierda">Izquierda</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="acc-tam-icono" className="text-[11px] text-muted-foreground">
              Tamaño de chevron
            </Label>
            <Select
              value={cfg.tamanoIcono}
              onValueChange={(val) =>
                updateConfig({ tamanoIcono: val as AccordionTamanoIcono })
              }
            >
              <SelectTrigger id="acc-tam-icono" className="h-8 text-xs">
                <SelectValue placeholder="Tamaño" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">Pequeño</SelectItem>
                <SelectItem value="md">Mediano</SelectItem>
                <SelectItem value="lg">Grande</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ─── Gestión de Secciones ────────────────────────────────────── */}
      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <WidgetSectionTitle>Secciones ({secciones.length})</WidgetSectionTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 gap-1 text-[11px]"
            onClick={agregarSeccion}
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {secciones.map((sec, idx) => {
            const isExpanded = seccionExpandidaId === sec.id;

            return (
              <div
                key={sec.id}
                className="rounded-lg border border-border bg-card p-3 shadow-xs flex flex-col gap-2.5"
              >
                {/* Header del ítem */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    className="flex-1 text-left font-medium text-xs truncate hover:text-primary transition-colors"
                    onClick={() =>
                      setSeccionExpandidaId(isExpanded ? null : sec.id)
                    }
                  >
                    {idx + 1}. {sec.titulo || "Sin título"}
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={idx === 0}
                      onClick={() => moverSeccion(idx, -1)}
                      title="Mover arriba"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={idx === secciones.length - 1}
                      onClick={() => moverSeccion(idx, 1)}
                      title="Mover abajo"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => eliminarSeccion(sec.id)}
                      title="Eliminar sección"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Campos desplegados de la sección */}
                {isExpanded && (
                  <div className="flex flex-col gap-2.5 pt-2 border-t border-border/60">
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] text-muted-foreground uppercase font-semibold">
                        Título del encabezado
                      </Label>
                      <Input
                        value={sec.titulo}
                        onChange={(e) =>
                          actualizarSeccion(sec.id, { titulo: e.target.value })
                        }
                        className="h-7 text-xs"
                        placeholder="Título de la sección"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] text-muted-foreground uppercase font-semibold">
                        Cuerpo del texto
                      </Label>
                      <textarea
                        value={sec.contenido}
                        onChange={(e) =>
                          actualizarSeccion(sec.id, { contenido: e.target.value })
                        }
                        rows={3}
                        className="w-full rounded-md border border-input bg-transparent px-2.5 py-1.5 text-xs shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                        placeholder="Contenido descriptivo"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] text-muted-foreground uppercase font-semibold">
                        URL de imagen (opcional)
                      </Label>
                      <Input
                        value={sec.imagenUrl ?? ""}
                        onChange={(e) =>
                          actualizarSeccion(sec.id, {
                            imagenUrl: e.target.value.trim() || undefined,
                          })
                        }
                        className="h-7 text-xs"
                        placeholder="https://..."
                      />
                    </div>

                    {sec.imagenUrl && (
                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px] text-muted-foreground uppercase font-semibold">
                          Descripción alternativa (alt)
                        </Label>
                        <Input
                          value={sec.imagenAlt ?? ""}
                          onChange={(e) =>
                            actualizarSeccion(sec.id, {
                              imagenAlt: e.target.value || undefined,
                            })
                          }
                          className="h-7 text-xs"
                          placeholder="Texto alternativo accesible"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <Checkbox
                        id={`sec-abierto-${sec.id}`}
                        checked={sec.abiertoPorDefecto ?? false}
                        onCheckedChange={(checked) =>
                          actualizarSeccion(sec.id, {
                            abiertoPorDefecto: Boolean(checked),
                          })
                        }
                      />
                      <Label
                        htmlFor={`sec-abierto-${sec.id}`}
                        className="text-[11px] font-normal cursor-pointer"
                      >
                        Abierto al cargar el slide
                      </Label>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
