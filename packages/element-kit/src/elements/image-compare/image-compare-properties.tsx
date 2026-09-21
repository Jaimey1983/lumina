import { useState, type ReactElement } from "react";
import type { ElementPropsPanelProps } from "@lumina/element-kit-core";
import { Checkbox } from "@lumina/ui/checkbox";
import { Input } from "@lumina/ui/input";
import { Label } from "@lumina/ui/label";
import { Slider, SliderThumb } from "@lumina/ui/slider";
import { Button } from "@lumina/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@lumina/ui/select";
import { WidgetSectionTitle } from "@lumina/editor-shared/widget-properties-panel";
import type {
  ImageCompareConfig,
  ImageCompareEstado,
  ImageCompareConfiguracion,
} from "./image-compare-types.js";
import { IMAGE_COMPARE_PRESETS } from "./image-compare-presets.js";

export function ImageComparePropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<ImageCompareEstado, ImageCompareConfig>): ReactElement {
  const cfg = estado.configuracion;
  const [selectedSide, setSelectedSide] = useState<"antes" | "despues">("antes");

  const updateConfig = (
    patch: Partial<ImageCompareConfiguracion>,
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

  const updateFraming = (
    patch: {
      offsetX?: number;
      offsetY?: number;
      escala?: number;
      objectFit?: "cover" | "contain";
      objectPosition?: string;
    },
  ) => {
    const isSync = cfg.sincronizarEncuadre !== false;
    const next: Partial<ImageCompareConfiguracion> = {};

    if (isSync || selectedSide === "antes") {
      if (patch.offsetX !== undefined) next.imagenAntesOffsetX = patch.offsetX;
      if (patch.offsetY !== undefined) next.imagenAntesOffsetY = patch.offsetY;
      if (patch.escala !== undefined) next.imagenAntesEscala = patch.escala;
      if (patch.objectFit !== undefined) next.imagenAntesObjectFit = patch.objectFit;
      if (patch.objectPosition !== undefined) next.imagenAntesObjectPosition = patch.objectPosition;
    }

    if (isSync || selectedSide === "despues") {
      if (patch.offsetX !== undefined) next.imagenDespuesOffsetX = patch.offsetX;
      if (patch.offsetY !== undefined) next.imagenDespuesOffsetY = patch.offsetY;
      if (patch.escala !== undefined) next.imagenDespuesEscala = patch.escala;
      if (patch.objectFit !== undefined) next.imagenDespuesObjectFit = patch.objectFit;
      if (patch.objectPosition !== undefined) next.imagenDespuesObjectPosition = patch.objectPosition;
    }

    updateConfig(next);
  };

  const currentScale =
    selectedSide === "antes"
      ? (cfg.imagenAntesEscala ?? 100)
      : (cfg.imagenDespuesEscala ?? 100);

  const currentOffsetX =
    selectedSide === "antes"
      ? (cfg.imagenAntesOffsetX ?? 0)
      : (cfg.imagenDespuesOffsetX ?? 0);

  const currentOffsetY =
    selectedSide === "antes"
      ? (cfg.imagenAntesOffsetY ?? 0)
      : (cfg.imagenDespuesOffsetY ?? 0);

  const currentFit =
    selectedSide === "antes"
      ? (cfg.imagenAntesObjectFit ?? "cover")
      : (cfg.imagenDespuesObjectFit ?? "cover");

  const currentPos =
    selectedSide === "antes"
      ? (cfg.imagenAntesObjectPosition ?? "center center")
      : (cfg.imagenDespuesObjectPosition ?? "center center");

  return (
    <div className="flex flex-col gap-4 p-1 text-slate-800">
      {/* 1. Presets */}
      <div className="space-y-2">
        <WidgetSectionTitle>Plantillas</WidgetSectionTitle>
        <div className="grid grid-cols-2 gap-1.5">
          {IMAGE_COMPARE_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              type="button"
              variant="outline"
              size="sm"
              className="h-8 justify-start text-xs font-normal"
              onClick={() => applyPreset(preset.id)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* 2. Componentes (Títulos y Subtítulo) */}
      <div className="space-y-2">
        <WidgetSectionTitle>Componentes</WidgetSectionTitle>
        <div className="space-y-2">
          {(
            [
              ["mostrarTituloWidget", "Título"],
              ["mostrarSubtitulo", "Subtítulo"],
              ["mostrarInstruccion", "Instrucción"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-2 text-xs"
            >
              <Checkbox
                checked={cfg[key] ?? true}
                onCheckedChange={(checked) =>
                  updateConfig({ [key]: checked === true })
                }
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* 3. Imágenes Antes y Después */}
      <div className="space-y-3">
        <WidgetSectionTitle>Imágenes</WidgetSectionTitle>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">URL Imagen Antes (Base izquierda/arriba)</Label>
          <Input
            value={cfg.imagenAntesUrl}
            onChange={(e) => updateConfig({ imagenAntesUrl: e.target.value })}
            placeholder="https://..."
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">URL Imagen Después (Derecha/abajo)</Label>
          <Input
            value={cfg.imagenDespuesUrl}
            onChange={(e) => updateConfig({ imagenDespuesUrl: e.target.value })}
            placeholder="https://..."
            className="h-8 text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Etiqueta Antes</Label>
            <Input
              value={cfg.etiquetaAntes}
              onChange={(e) => updateConfig({ etiquetaAntes: e.target.value })}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Etiqueta Después</Label>
            <Input
              value={cfg.etiquetaDespues}
              onChange={(e) => updateConfig({ etiquetaDespues: e.target.value })}
              className="h-8 text-xs"
            />
          </div>
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* 4. Encuadre, Zoom y Posicionamiento */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <WidgetSectionTitle>Encuadre de imagen</WidgetSectionTitle>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox
            checked={cfg.sincronizarEncuadre !== false}
            onCheckedChange={(checked) =>
              updateConfig({ sincronizarEncuadre: checked === true })
            }
          />
          Sincronizar encuadre (mover ambas fotos)
        </label>

        {cfg.sincronizarEncuadre === false && (
          <div className="flex gap-1 pt-1">
            <Button
              type="button"
              size="sm"
              variant={selectedSide === "antes" ? "secondary" : "outline"}
              className="flex-1 text-xs"
              onClick={() => setSelectedSide("antes")}
            >
              Foto Antes
            </Button>
            <Button
              type="button"
              size="sm"
              variant={selectedSide === "despues" ? "secondary" : "outline"}
              className="flex-1 text-xs"
              onClick={() => setSelectedSide("despues")}
            >
              Foto Después
            </Button>
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Zoom</Label>
            <span className="text-xs tabular-nums text-slate-500">
              {currentScale}%
            </span>
          </div>
          <Slider
            min={50}
            max={200}
            step={5}
            value={[currentScale]}
            onValueChange={([v]) => updateFraming({ escala: v })}
          >
            <SliderThumb />
          </Slider>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Desplazamiento X</Label>
            <span className="text-xs tabular-nums text-slate-500">
              {currentOffsetX}%
            </span>
          </div>
          <Slider
            min={-40}
            max={40}
            step={1}
            value={[currentOffsetX]}
            onValueChange={([v]) => updateFraming({ offsetX: v })}
          >
            <SliderThumb />
          </Slider>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Desplazamiento Y</Label>
            <span className="text-xs tabular-nums text-slate-500">
              {currentOffsetY}%
            </span>
          </div>
          <Slider
            min={-40}
            max={40}
            step={1}
            value={[currentOffsetY]}
            onValueChange={([v]) => updateFraming({ offsetY: v })}
          >
            <SliderThumb />
          </Slider>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Ajuste</Label>
          <div className="flex gap-1">
            {(["cover", "contain"] as const).map((fit) => (
              <Button
                key={fit}
                type="button"
                size="sm"
                variant={currentFit === fit ? "secondary" : "outline"}
                className="flex-1 text-xs capitalize"
                onClick={() => updateFraming({ objectFit: fit })}
              >
                {fit}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Posición</Label>
          <Select
            value={currentPos}
            onValueChange={(v) => updateFraming({ objectPosition: v })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="center top" className="text-xs">Arriba</SelectItem>
              <SelectItem value="center center" className="text-xs">Centro</SelectItem>
              <SelectItem value="center bottom" className="text-xs">Abajo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-[10px] leading-snug text-slate-500">
          En el lienzo: arrastra la imagen seleccionada para encuadrarla; usa el tirador de la esquina para cambiar el zoom.
        </p>
      </div>

      <hr className="border-slate-200" />

      {/* 5. Divisor y Opciones de visualización */}
      <div className="space-y-3">
        <WidgetSectionTitle>Barra divisoria</WidgetSectionTitle>

        <div className="space-y-1.5">
          <Label className="text-xs">Orientación</Label>
          <Select
            value={cfg.orientacion}
            onValueChange={(v) =>
              updateConfig({ orientacion: v as "horizontal" | "vertical" })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="horizontal" className="text-xs">
                Horizontal (Izquierda / Derecha)
              </SelectItem>
              <SelectItem value="vertical" className="text-xs">
                Vertical (Arriba / Abajo)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Posición inicial del divisor</Label>
            <span className="text-xs tabular-nums text-slate-500">
              {cfg.posicionInicial}%
            </span>
          </div>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[cfg.posicionInicial]}
            onValueChange={([v]) => updateConfig({ posicionInicial: v })}
          >
            <SliderThumb />
          </Slider>
        </div>

        <div className="space-y-2 pt-1">
          <label className="flex cursor-pointer items-center gap-2 text-xs">
            <Checkbox
              checked={cfg.mostrarEtiquetas}
              onCheckedChange={(checked) =>
                updateConfig({ mostrarEtiquetas: checked === true })
              }
            />
            Mostrar etiquetas flotantes
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-xs">
            <Checkbox
              checked={cfg.mostrarBotonDeslizador}
              onCheckedChange={(checked) =>
                updateConfig({ mostrarBotonDeslizador: checked === true })
              }
            />
            Mostrar tirador central
          </label>
        </div>
      </div>
    </div>
  );
}
