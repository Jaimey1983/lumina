import type { ReactElement } from "react";
import { PresetGallery, aplicarPreset } from "@lumina/editor-shared/preset-gallery";
import { WidgetSectionTitle } from "@lumina/editor-shared/widget-properties-panel";
import { Button } from "@lumina/ui/button";
import { Checkbox } from "@lumina/ui/checkbox";
import { Input } from "@lumina/ui/input";
import { Label } from "@lumina/ui/label";
import { Textarea } from "@lumina/ui/textarea";
import { presetsDelWidget } from "../widget-presets.js";
import { CALLOUT_ICONOS } from "./callout-icons.js";
import { CALLOUT_ESTILOS, CALLOUT_TONOS, metaDeTono, normalizeCalloutWidget } from "./callout-defaults.js";
import type { CalloutConfiguracion, CalloutEstado } from "./callout-types.js";

export interface CalloutPropertiesProps {
  estado: CalloutEstado;
  onChange: (estado: CalloutEstado) => void;
}

export function CalloutProperties({ estado: crudo, onChange }: CalloutPropertiesProps): ReactElement {
  const estado = normalizeCalloutWidget(crudo);
  const cfg = estado.configuracion;
  const actualizar = (parche: Partial<CalloutConfiguracion>) =>
    onChange({ ...estado, configuracion: { ...cfg, ...parche } });

  return (
    <div className="flex flex-col gap-5">
      <PresetGallery
        presets={presetsDelWidget("callout")}
        estado={estado}
        storageKey="widget.callout.estilos"
        onSelect={(preset) => onChange(aplicarPreset(estado, preset))}
      />

      <div className="space-y-2">
        <WidgetSectionTitle>Tipo de nota</WidgetSectionTitle>
        <div className="grid grid-cols-2 gap-1">
          {CALLOUT_TONOS.map((t) => (
            <Button
              key={t.id}
              type="button"
              size="sm"
              variant={cfg.tono === t.id ? "primary" : "outline"}
              className="h-8 text-xs"
              aria-pressed={cfg.tono === t.id}
              onClick={() => {
                // Si el título era el del tono anterior (no lo cambió el docente), sigue al nuevo.
                const seguia = cfg.titulo === metaDeTono(cfg.tono).tituloPorDefecto;
                actualizar({ tono: t.id, ...(seguia ? { titulo: t.tituloPorDefecto } : {}) });
              }}
            >
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <WidgetSectionTitle>Estilo</WidgetSectionTitle>
        <div className="flex gap-1">
          {CALLOUT_ESTILOS.map((e) => (
            <Button
              key={e.id}
              type="button"
              size="sm"
              variant={cfg.estilo === e.id ? "primary" : "outline"}
              className="h-8 flex-1 text-xs"
              aria-pressed={cfg.estilo === e.id}
              onClick={() => actualizar({ estilo: e.id })}
            >
              {e.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <WidgetSectionTitle>Contenido</WidgetSectionTitle>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox checked={cfg.mostrarTitulo} onCheckedChange={(v) => actualizar({ mostrarTitulo: v === true })} />
          Mostrar título
        </label>
        {cfg.mostrarTitulo ? (
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="callout-titulo">
              Título
            </Label>
            <Input
              id="callout-titulo"
              className="h-8 text-xs"
              value={cfg.titulo}
              onChange={(e) => actualizar({ titulo: e.target.value })}
            />
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="callout-cuerpo">
            Texto
          </Label>
          <Textarea
            id="callout-cuerpo"
            className="min-h-24 text-xs"
            value={cfg.cuerpo}
            onChange={(e) => actualizar({ cuerpo: e.target.value })}
          />
          <p className="text-[11px] text-muted-foreground">
            Admite <b>&lt;b&gt;</b>, <i>&lt;i&gt;</i>, &lt;u&gt; y enlaces; el resto se descarta.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <WidgetSectionTitle>Icono</WidgetSectionTitle>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox checked={cfg.mostrarIcono} onCheckedChange={(v) => actualizar({ mostrarIcono: v === true })} />
          Mostrar icono
        </label>
        {cfg.mostrarIcono ? (
          <div className="grid grid-cols-6 gap-1">
            <Button
              type="button"
              size="sm"
              variant={cfg.icono === "auto" ? "primary" : "outline"}
              className="h-8 px-0 text-[10px]"
              aria-pressed={cfg.icono === "auto"}
              onClick={() => actualizar({ icono: "auto" })}
            >
              Auto
            </Button>
            {Object.entries(CALLOUT_ICONOS).map(([id, { label, Icono }]) => (
              <Button
                key={id}
                type="button"
                size="sm"
                variant={cfg.icono === id ? "primary" : "outline"}
                className="h-8 px-0"
                aria-label={`Icono ${label}`}
                aria-pressed={cfg.icono === id}
                title={label}
                onClick={() => actualizar({ icono: id })}
              >
                <Icono className="size-4" />
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <WidgetSectionTitle>Color</WidgetSectionTitle>
        <div className="flex items-center gap-2">
          <input
            type="color"
            aria-label="Color propio"
            value={cfg.colorAcento ?? "#2563eb"}
            onChange={(e) => actualizar({ colorAcento: e.target.value })}
            className="h-8 w-8 cursor-pointer rounded border-0 p-0"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            disabled={!cfg.colorAcento}
            onClick={() => actualizar({ colorAcento: undefined })}
          >
            Usar el color del tipo
          </Button>
        </div>
      </div>
    </div>
  );
}
