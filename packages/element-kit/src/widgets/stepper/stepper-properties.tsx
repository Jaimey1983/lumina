import type { ReactElement } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { PresetGallery, aplicarPreset } from "@lumina/editor-shared/preset-gallery";
import { WidgetSectionTitle } from "@lumina/editor-shared/widget-properties-panel";
import { Button } from "@lumina/ui/button";
import { Checkbox } from "@lumina/ui/checkbox";
import { Input } from "@lumina/ui/input";
import { Label } from "@lumina/ui/label";
import { Textarea } from "@lumina/ui/textarea";
import { presetsDelWidget } from "../widget-presets.js";
import {
  STEPPER_INDICADORES,
  STEPPER_MODOS,
  STEPPER_PASOS_MAX,
  STEPPER_PASOS_MIN,
  STEPPER_TRANSICIONES,
  normalizeStepperWidget,
  pasoPorDefecto,
} from "./stepper-defaults.js";
import type { StepperConfiguracion, StepperEstado, StepperPaso } from "./stepper-types.js";

export interface StepperPropertiesProps {
  estado: StepperEstado;
  onChange: (estado: StepperEstado) => void;
}

export function StepperProperties({ estado: crudo, onChange }: StepperPropertiesProps): ReactElement {
  const estado = normalizeStepperWidget(crudo);
  const cfg = estado.configuracion;
  const actualizar = (parche: Partial<StepperConfiguracion>) => onChange({ ...estado, configuracion: { ...cfg, ...parche } });
  const cambiarPaso = (id: string, parche: Partial<StepperPaso>) =>
    actualizar({ pasos: cfg.pasos.map((p) => (p.id === id ? { ...p, ...parche } : p)) });
  const mover = (i: number, delta: -1 | 1) => {
    const d = i + delta;
    if (d < 0 || d >= cfg.pasos.length) return;
    const copia = [...cfg.pasos];
    [copia[i], copia[d]] = [copia[d], copia[i]];
    actualizar({ pasos: copia });
  };
  const agregar = () => {
    let n = cfg.pasos.length + 1;
    while (cfg.pasos.some((p) => p.id === `paso-${n}`)) n += 1;
    actualizar({ pasos: [...cfg.pasos, pasoPorDefecto(n)] });
  };

  const opciones = <T extends string>(
    etiqueta: string,
    lista: { id: T; label: string }[],
    actual: T,
    clave: keyof StepperConfiguracion,
  ) => (
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
            onClick={() => actualizar({ [clave]: o.id } as Partial<StepperConfiguracion>)}
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
        presets={presetsDelWidget("stepper")}
        estado={estado}
        storageKey="widget.stepper.estilos"
        onSelect={(preset) => onChange(aplicarPreset(estado, preset))}
      />

      <div className="space-y-2">
        <WidgetSectionTitle>Comportamiento</WidgetSectionTitle>
        {opciones("Cómo se muestran los pasos", STEPPER_MODOS, cfg.modo, "modo")}
        {opciones("Indicador de progreso", STEPPER_INDICADORES, cfg.indicador, "indicador")}
        {opciones("Transición", STEPPER_TRANSICIONES, cfg.transicion, "transicion")}
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox checked={cfg.bloquearSaltos} onCheckedChange={(v) => actualizar({ bloquearSaltos: v === true })} />
          No permitir saltar pasos sin verlos
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox checked={cfg.mostrarAnterior} onCheckedChange={(v) => actualizar({ mostrarAnterior: v === true })} />
          Mostrar «Anterior»
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox
            checked={cfg.avance === "slide"}
            onCheckedChange={(v) => actualizar({ avance: v === true ? "slide" : "independiente" })}
          />
          Al terminar, ofrecer «Continuar» al siguiente slide
        </label>
        <p className="text-[11px] text-muted-foreground">
          Al llegar al último paso el widget emite «visitado»: úsalo en Interacciones para mostrar un
          bloque o habilitar un botón.
        </p>
      </div>

      <div className="space-y-2">
        <WidgetSectionTitle>Pasos ({cfg.pasos.length})</WidgetSectionTitle>
        <ul className="space-y-3">
          {cfg.pasos.map((p, i) => (
            <li key={p.id} className="space-y-1.5 rounded-md border border-border p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Paso {i + 1}</span>
                <div className="flex gap-0.5">
                  <Button type="button" variant="ghost" size="icon" className="size-7" aria-label={`Subir paso ${i + 1}`} disabled={i === 0} onClick={() => mover(i, -1)}>
                    <ArrowUp className="size-3.5" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="size-7" aria-label={`Bajar paso ${i + 1}`} disabled={i === cfg.pasos.length - 1} onClick={() => mover(i, 1)}>
                    <ArrowDown className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label={`Quitar paso ${i + 1}`}
                    disabled={cfg.pasos.length <= STEPPER_PASOS_MIN}
                    onClick={() => actualizar({ pasos: cfg.pasos.filter((x) => x.id !== p.id) })}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
              <Input className="h-8 text-xs" placeholder="Título del paso" aria-label={`Título del paso ${i + 1}`} value={p.titulo} onChange={(e) => cambiarPaso(p.id, { titulo: e.target.value })} />
              <Textarea className="min-h-20 text-xs" placeholder="Texto del paso" aria-label={`Texto del paso ${i + 1}`} value={p.cuerpo} onChange={(e) => cambiarPaso(p.id, { cuerpo: e.target.value })} />
            </li>
          ))}
        </ul>
        <Button type="button" size="sm" variant="outline" className="h-8 text-xs" disabled={cfg.pasos.length >= STEPPER_PASOS_MAX} onClick={agregar}>
          <Plus className="mr-1 size-3.5" /> Agregar paso
        </Button>
      </div>
    </div>
  );
}
