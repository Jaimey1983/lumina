import type { ReactElement } from "react";
import { PresetGallery, aplicarPreset } from "@lumina/editor-shared/preset-gallery";
import { WidgetSectionTitle } from "@lumina/editor-shared/widget-properties-panel";
import { Button } from "@lumina/ui/button";
import { Checkbox } from "@lumina/ui/checkbox";
import { Input } from "@lumina/ui/input";
import { Label } from "@lumina/ui/label";
import { presetsDelWidget } from "../widget-presets.js";
import { SELLO_CONDICIONES, SELLO_FORMAS, SELLO_TONOS, normalizeSelloWidget } from "./sello-defaults.js";
import { SELLO_ICONOS } from "./sello-icons.js";
import type { SelloConfiguracion, SelloEstado } from "./sello-types.js";

export interface SelloPropertiesProps {
  estado: SelloEstado;
  onChange: (estado: SelloEstado) => void;
}

export function SelloProperties({ estado: crudo, onChange }: SelloPropertiesProps): ReactElement {
  const estado = normalizeSelloWidget(crudo);
  const cfg = estado.configuracion;
  const actualizar = (parche: Partial<SelloConfiguracion>) => onChange({ ...estado, configuracion: { ...cfg, ...parche } });

  const grupo = <T extends string>(etiqueta: string, lista: { id: T; label: string }[], actual: T, clave: keyof SelloConfiguracion) => (
    <div className="space-y-1.5">
      <Label className="text-xs">{etiqueta}</Label>
      <div className="flex flex-wrap gap-1">
        {lista.map((o) => (
          <Button
            key={o.id}
            type="button"
            size="sm"
            variant={actual === o.id ? "primary" : "outline"}
            className="h-8 flex-1 text-xs"
            aria-pressed={actual === o.id}
            onClick={() => actualizar({ [clave]: o.id } as Partial<SelloConfiguracion>)}
          >
            {o.label}
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <PresetGallery
        presets={presetsDelWidget("sello")}
        estado={estado}
        storageKey="widget.sello.estilos"
        onSelect={(preset) => onChange(aplicarPreset(estado, preset))}
      />

      <div className="space-y-2">
        <WidgetSectionTitle>Vista previa</WidgetSectionTitle>
        <div className="flex gap-1">
          {(["ganado", "bloqueado"] as const).map((v) => (
            <Button
              key={v}
              type="button"
              size="sm"
              variant={cfg.vistaPrevia === v ? "primary" : "outline"}
              className="h-8 flex-1 text-xs"
              aria-pressed={cfg.vistaPrevia === v}
              onClick={() => actualizar({ vistaPrevia: v })}
            >
              {v === "ganado" ? "Ganada" : "Bloqueada"}
            </Button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Solo cambia lo que ves aquí. Al presentar, el estado lo decide la condición de abajo.
        </p>
      </div>

      <div className="space-y-2">
        <WidgetSectionTitle>Cuándo se gana</WidgetSectionTitle>
        {grupo("Condición", SELLO_CONDICIONES, cfg.condicion, "condicion")}
        <p className="text-[11px] text-muted-foreground">{SELLO_CONDICIONES.find((c) => c.id === cfg.condicion)?.ayuda}</p>
        <p className="text-[11px] text-muted-foreground">
          La insignia no calcula ni guarda puntajes: solo muestra el estado que le da una regla de
          Interacciones («Cambiar estado» sobre este bloque).
        </p>
      </div>

      <div className="space-y-2">
        <WidgetSectionTitle>Aspecto</WidgetSectionTitle>
        {grupo("Forma", SELLO_FORMAS, cfg.forma, "forma")}
        {grupo("Color", SELLO_TONOS, cfg.tono, "tono")}
        <div className="flex items-center gap-2">
          <input
            type="color"
            aria-label="Color propio"
            value={cfg.colorAcento ?? "#d4a017"}
            onChange={(e) => actualizar({ colorAcento: e.target.value })}
            className="h-8 w-8 cursor-pointer rounded border-0 p-0"
          />
          <Button type="button" size="sm" variant="outline" className="h-8 text-xs" disabled={!cfg.colorAcento} onClick={() => actualizar({ colorAcento: undefined })}>
            Usar el color elegido arriba
          </Button>
        </div>
        <Label className="text-xs">Icono</Label>
        <div className="grid grid-cols-6 gap-1">
          {Object.entries(SELLO_ICONOS).map(([id, { label, Icono }]) => (
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
      </div>

      <div className="space-y-2">
        <WidgetSectionTitle>Textos</WidgetSectionTitle>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="sello-titulo">Título</Label>
          <Input id="sello-titulo" className="h-8 text-xs" maxLength={60} value={cfg.titulo} onChange={(e) => actualizar({ titulo: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="sello-subtitulo">Texto al ganarla</Label>
          <Input id="sello-subtitulo" className="h-8 text-xs" maxLength={120} value={cfg.subtitulo} onChange={(e) => actualizar({ subtitulo: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="sello-bloqueado">Texto mientras está bloqueada</Label>
          <Input id="sello-bloqueado" className="h-8 text-xs" maxLength={60} value={cfg.textoBloqueado} onChange={(e) => actualizar({ textoBloqueado: e.target.value })} />
        </div>
      </div>

      <div className="space-y-2">
        <WidgetSectionTitle>Al ganarla</WidgetSectionTitle>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox checked={cfg.animacion} onCheckedChange={(v) => actualizar({ animacion: v === true })} />
          Pulso y brillo
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox checked={cfg.confeti} onCheckedChange={(v) => actualizar({ confeti: v === true })} />
          Confeti
        </label>
      </div>
    </div>
  );
}
