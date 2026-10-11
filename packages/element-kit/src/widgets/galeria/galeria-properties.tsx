import type { ReactElement } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2, TriangleAlert } from "lucide-react";
import { PresetGallery, aplicarPreset } from "@lumina/editor-shared/preset-gallery";
import { WidgetSectionTitle } from "@lumina/editor-shared/widget-properties-panel";
import { Button } from "@lumina/ui/button";
import { Checkbox } from "@lumina/ui/checkbox";
import { Input } from "@lumina/ui/input";
import { Label } from "@lumina/ui/label";
import { Slider, SliderThumb } from "@lumina/ui/slider";
import { presetsDelWidget } from "../widget-presets.js";
import {
  GALERIA_COLUMNAS_MAX,
  GALERIA_COLUMNAS_MIN,
  GALERIA_DISPOSICIONES,
  GALERIA_MAX_IMAGENES,
  GALERIA_PROPORCIONES,
  faltaAlt,
  imagenDeEjemplo,
  normalizeGaleriaWidget,
} from "./galeria-defaults.js";
import type { GaleriaConfiguracion, GaleriaEstado, GaleriaImagen } from "./galeria-types.js";

export interface GaleriaPropertiesProps {
  estado: GaleriaEstado;
  onChange: (estado: GaleriaEstado) => void;
}

export function GaleriaProperties({ estado: crudo, onChange }: GaleriaPropertiesProps): ReactElement {
  const estado = normalizeGaleriaWidget(crudo);
  const cfg = estado.configuracion;
  const actualizar = (parche: Partial<GaleriaConfiguracion>) =>
    onChange({ ...estado, configuracion: { ...cfg, ...parche } });
  const cambiarImagen = (id: string, parche: Partial<GaleriaImagen>) =>
    actualizar({ imagenes: cfg.imagenes.map((i) => (i.id === id ? { ...i, ...parche } : i)) });
  const mover = (indice: number, delta: -1 | 1) => {
    const destino = indice + delta;
    if (destino < 0 || destino >= cfg.imagenes.length) return;
    const copia = [...cfg.imagenes];
    [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
    actualizar({ imagenes: copia });
  };
  const agregar = () => {
    if (cfg.imagenes.length >= GALERIA_MAX_IMAGENES) return;
    let n = cfg.imagenes.length + 1;
    while (cfg.imagenes.some((i) => i.id === `imagen-${n}`)) n += 1;
    // Nace con el texto alternativo vacío a propósito: el aviso obliga a escribirlo.
    actualizar({ imagenes: [...cfg.imagenes, { ...imagenDeEjemplo(n), alt: "", titulo: undefined }] });
  };

  const sinAlt = cfg.imagenes.filter(faltaAlt).length;

  return (
    <div className="flex flex-col gap-5">
      <PresetGallery
        presets={presetsDelWidget("galeria")}
        estado={estado}
        storageKey="widget.galeria.estilos"
        onSelect={(preset) => onChange(aplicarPreset(estado, preset))}
      />

      <div className="space-y-2">
        <WidgetSectionTitle>Disposición</WidgetSectionTitle>
        <div className="flex gap-1">
          {GALERIA_DISPOSICIONES.map((d) => (
            <Button
              key={d.id}
              type="button"
              size="sm"
              variant={cfg.disposicion === d.id ? "primary" : "outline"}
              className="h-8 flex-1 text-xs"
              aria-pressed={cfg.disposicion === d.id}
              onClick={() => actualizar({ disposicion: d.id })}
            >
              {d.label}
            </Button>
          ))}
        </div>
        {cfg.disposicion !== "tira" ? (
          <div className="space-y-1.5">
            <Label className="text-xs">Columnas: {cfg.columnas}</Label>
            <Slider
              min={GALERIA_COLUMNAS_MIN}
              max={GALERIA_COLUMNAS_MAX}
              step={1}
              value={[cfg.columnas]}
              onValueChange={([v]) => actualizar({ columnas: v })}
            >
              <SliderThumb />
            </Slider>
          </div>
        ) : null}
        {cfg.disposicion !== "mosaico" ? (
          <div className="flex gap-1">
            {GALERIA_PROPORCIONES.map((p) => (
              <Button
                key={p.id}
                type="button"
                size="sm"
                variant={cfg.proporcion === p.id ? "primary" : "outline"}
                className="h-8 flex-1 text-xs"
                aria-pressed={cfg.proporcion === p.id}
                onClick={() => actualizar({ proporcion: p.id })}
              >
                {p.label}
              </Button>
            ))}
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label className="text-xs">Separación: {cfg.espacio} px</Label>
          <Slider min={0} max={32} step={1} value={[cfg.espacio]} onValueChange={([v]) => actualizar({ espacio: v })}>
            <SliderThumb />
          </Slider>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Esquinas: {cfg.radio} px</Label>
          <Slider min={0} max={32} step={1} value={[cfg.radio]} onValueChange={([v]) => actualizar({ radio: v })}>
            <SliderThumb />
          </Slider>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox checked={cfg.mostrarTitulos} onCheckedChange={(v) => actualizar({ mostrarTitulos: v === true })} />
          Mostrar el pie de cada imagen
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox checked={cfg.lightbox} onCheckedChange={(v) => actualizar({ lightbox: v === true })} />
          Ampliar al tocar (lightbox)
        </label>
      </div>

      <div className="space-y-2">
        <WidgetSectionTitle>Imágenes ({cfg.imagenes.length})</WidgetSectionTitle>
        {sinAlt > 0 ? (
          <p
            role="alert"
            className="flex items-start gap-1.5 rounded-md border border-amber-300 bg-amber-50 p-2 text-[11px] text-amber-900"
          >
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {sinAlt === 1
              ? "1 imagen no tiene texto alternativo."
              : `${sinAlt} imágenes no tienen texto alternativo.`}{" "}
            Descríbela para quien no puede verla, o márcala como decorativa.
          </p>
        ) : null}
        <ul className="space-y-3">
          {cfg.imagenes.map((img, i) => {
            const falta = faltaAlt(img);
            return (
              <li key={img.id} className="space-y-1.5 rounded-md border border-border p-2" data-falta-alt={falta ? "true" : undefined}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Imagen {i + 1}</span>
                  <div className="flex gap-0.5">
                    <Button type="button" variant="ghost" size="icon" className="size-7" aria-label={`Subir imagen ${i + 1}`} disabled={i === 0} onClick={() => mover(i, -1)}>
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="size-7" aria-label={`Bajar imagen ${i + 1}`} disabled={i === cfg.imagenes.length - 1} onClick={() => mover(i, 1)}>
                      <ArrowDown className="size-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="size-7" aria-label={`Quitar imagen ${i + 1}`} onClick={() => actualizar({ imagenes: cfg.imagenes.filter((x) => x.id !== img.id) })}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <Input
                  className="h-8 text-xs"
                  placeholder="https://…"
                  aria-label={`Dirección de la imagen ${i + 1}`}
                  value={img.url.startsWith("data:") ? "" : img.url}
                  onChange={(e) => cambiarImagen(img.id, { url: e.target.value })}
                />
                <Input
                  className="h-8 text-xs"
                  placeholder="Texto alternativo (obligatorio)"
                  aria-label={`Texto alternativo de la imagen ${i + 1}`}
                  aria-invalid={falta || undefined}
                  disabled={img.decorativa === true}
                  value={img.alt}
                  onChange={(e) => cambiarImagen(img.id, { alt: e.target.value })}
                />
                {falta ? (
                  <p className="text-[11px] font-medium text-amber-800">Falta el texto alternativo.</p>
                ) : null}
                <label className="flex cursor-pointer items-center gap-2 text-[11px]">
                  <Checkbox
                    checked={img.decorativa === true}
                    onCheckedChange={(v) => cambiarImagen(img.id, { decorativa: v === true ? true : undefined })}
                  />
                  Imagen decorativa (sin texto alternativo)
                </label>
                <Input
                  className="h-8 text-xs"
                  placeholder="Pie de foto (opcional)"
                  aria-label={`Pie de la imagen ${i + 1}`}
                  value={img.titulo ?? ""}
                  onChange={(e) => cambiarImagen(img.id, { titulo: e.target.value || undefined })}
                />
              </li>
            );
          })}
        </ul>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 text-xs"
          disabled={cfg.imagenes.length >= GALERIA_MAX_IMAGENES}
          onClick={agregar}
        >
          <Plus className="mr-1 size-3.5" /> Agregar imagen
        </Button>
      </div>
    </div>
  );
}
