'use client';

import { useEffect, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
} from 'lucide-react';

import type { Block, FlipCard, FlipCardsWidget } from '@lumina/types/slide';
import { createDefaultFlipCard } from './flip-cards-defaults.js';
import { Button } from '@lumina/ui/button';
import { Checkbox } from '@lumina/ui/checkbox';
import { FieldHelp } from '@lumina/ui/field-help';
import { Label } from '@lumina/ui/label';
import { Slider, SliderThumb } from '@lumina/ui/slider';
import { Toggle } from '@lumina/ui/toggle';

import {
  DEFAULT_FLIP_CARDS_CONFIG,
  normalizeFlipCardsWidget,
  type FlipCardsAlineacion,
  type FlipCardsCaraConfig,
  type FlipCardsPlantillaId,
} from './flip-cards-config.js';
import { FlipCardsTemplateGallery } from './flip-cards-template-gallery.js';
import {
  applyFlipCardsPlantilla,
  resolveFlipCardsPlantillaId,
} from './flip-cards-templates.js';
import { WidgetSectionTitle } from '@lumina/editor-shared/widget-properties-panel';
import { CollapsibleSection } from '@lumina/ui/collapsible-section';
import { PresetGallery, aplicarPreset } from '@lumina/editor-shared/preset-gallery';
import { presetsDelWidget } from '../widget-presets.js';
import {
  FLIP_CARDS_ESTILOS_T11_IDS,
  FLIP_CARDS_GIROS,
  leerOpcionesT11,
  type FlipCardsConfigT11,
  type FlipCardsGiro,
  type FlipCardsModo,
} from './flip-cards-t11.js';
import { FlipCardsAppearanceProperties } from './flip-cards-appearance-properties.js';

function CaraCheckboxes({
  label,
  cara,
  onChange,
}: {
  label: string;
  cara: FlipCardsCaraConfig;
  onChange: (patch: Partial<FlipCardsCaraConfig>) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold text-foreground">{label}</p>
      {(
        [
          ['mostrarImagen', 'Imagen'],
          ['mostrarTitulo', 'Título'],
          ['mostrarCuerpo', 'Cuerpo'],
        ] as const
      ).map(([key, text]) => (
        <label key={key} className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox
            checked={cara[key]}
            onCheckedChange={(checked) => onChange({ [key]: checked === true })}
          />
          {text}
        </label>
      ))}
    </div>
  );
}

function cardHasMeaningfulContent(card: FlipCard): boolean {
  const sample = createDefaultFlipCard(99);
  return (
    !!card.frente.imagen ||
    !!card.reverso.imagen ||
    card.frente.titulo.trim() !== sample.frente.titulo ||
    card.frente.cuerpo.trim() !== sample.frente.cuerpo ||
    card.reverso.titulo.trim() !== sample.reverso.titulo ||
    card.reverso.cuerpo.trim() !== sample.reverso.cuerpo
  );
}

export interface FlipCardsWidgetComponentesProps {
  block: FlipCardsWidget;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}

export function FlipCardsWidgetComponentes({
  block: rawBlock,
  applyNow,
}: FlipCardsWidgetComponentesProps) {
  const block = normalizeFlipCardsWidget(rawBlock);
  const configuracion = {
    ...DEFAULT_FLIP_CARDS_CONFIG,
    ...block.configuracion,
    frente: {
      ...DEFAULT_FLIP_CARDS_CONFIG.frente,
      ...block.configuracion.frente,
    },
    reverso: {
      ...DEFAULT_FLIP_CARDS_CONFIG.reverso,
      ...block.configuracion.reverso,
    },
  };

  const update = (fn: (w: FlipCardsWidget) => FlipCardsWidget) => {
    void applyNow((b) => (b.tipo === 'flip-cards' ? fn(normalizeFlipCardsWidget(b)) : b));
  };

  const setAlineacion = (alineacionInstruccion: FlipCardsAlineacion) => {
    update((w) => ({
      ...w,
      configuracion: { ...w.configuracion, alineacionInstruccion },
    }));
  };

  return (
    <div className="space-y-3">
      <WidgetSectionTitle>Componentes</WidgetSectionTitle>
      {(
        [
          ['mostrarTituloWidget', 'Título'],
          ['mostrarSubtitulo', 'Subtítulo'],
          ['mostrarInstruccion', 'Instrucción'],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox
            checked={configuracion[key]}
            onCheckedChange={(checked) =>
              update((w) => ({
                ...w,
                configuracion: { ...w.configuracion, [key]: checked === true },
              }))
            }
          />
          {label}
        </label>
      ))}
      {configuracion.mostrarInstruccion ? (
        <div className="space-y-1.5 pl-1">
          <Label className="text-xs">Alineación instrucción</Label>
          <div className="flex gap-0.5">
            {(
              [
                ['izquierda', AlignLeft],
                ['centro', AlignCenter],
                ['derecha', AlignRight],
              ] as const
            ).map(([align, Icon]) => (
              <Toggle
                key={align}
                size="sm"
                pressed={configuracion.alineacionInstruccion === align}
                aria-label={align}
                onPressedChange={() => setAlineacion(align)}
              >
                <Icon className="size-3.5" />
              </Toggle>
            ))}
          </div>
        </div>
      ) : null}
      <label className="flex cursor-pointer items-center gap-2 text-xs">
        <Checkbox
          checked={configuracion.mostrarBotonAnterior}
          onCheckedChange={(checked) =>
            update((w) => ({
              ...w,
              configuracion: {
                ...w.configuracion,
                mostrarBotonAnterior: checked === true,
              },
            }))
          }
        />
        Botón anterior
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-xs">
        <Checkbox
          checked={configuracion.mostrarBotonSiguiente}
          onCheckedChange={(checked) =>
            update((w) => ({
              ...w,
              configuracion: {
                ...w.configuracion,
                mostrarBotonSiguiente: checked === true,
              },
            }))
          }
        />
        Botón siguiente
      </label>
    </div>
  );
}

export interface FlipCardsPropertiesProps {
  block: FlipCardsWidget;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
  /** Oculta la sección Componentes (se muestra aparte en el panel contextual). */
  hideComponentes?: boolean;
}

export function FlipCardsProperties({
  block: rawBlock,
  applyNow,
  hideComponentes = false,
}: FlipCardsPropertiesProps) {
  const block = normalizeFlipCardsWidget(rawBlock);
  const configuracion = {
    ...DEFAULT_FLIP_CARDS_CONFIG,
    ...block.configuracion,
    espacioEntreTarjetas:
      block.configuracion.espacioEntreTarjetas ?? DEFAULT_FLIP_CARDS_CONFIG.espacioEntreTarjetas,
    paddingContenedor:
      block.configuracion.paddingContenedor ?? DEFAULT_FLIP_CARDS_CONFIG.paddingContenedor,
    frente: {
      ...DEFAULT_FLIP_CARDS_CONFIG.frente,
      ...block.configuracion.frente,
    },
    reverso: {
      ...DEFAULT_FLIP_CARDS_CONFIG.reverso,
      ...block.configuracion.reverso,
    },
  };

  const update = (fn: (w: FlipCardsWidget) => FlipCardsWidget) => {
    void applyNow((b) => (b.tipo === 'flip-cards' ? fn(normalizeFlipCardsWidget(b)) : b));
  };

  const [countDraft, setCountDraft] = useState(block.tarjetas.length);
  useEffect(() => {
    setCountDraft(block.tarjetas.length);
  }, [block.tarjetas.length]);

  const setCardCount = (nextCount: number) => {
    const n = Math.max(2, nextCount);
    if (n < countDraft) {
      const last = block.tarjetas[block.tarjetas.length - 1];
      if (last && cardHasMeaningfulContent(last)) {
        const ok = window.confirm(
          'La última tarjeta tiene contenido. ¿Eliminarla de todas formas?',
        );
        if (!ok) return;
      }
    }
    setCountDraft(n);
    update((w) => {
      let tarjetas = [...w.tarjetas];
      while (tarjetas.length < n) {
        tarjetas.push(createDefaultFlipCard(tarjetas.length + 1));
      }
      while (tarjetas.length > n) {
        tarjetas = tarjetas.slice(0, -1);
      }
      return { ...w, tarjetas };
    });
  };

  const activePlantillaId = resolveFlipCardsPlantillaId(block);
  const opcionesT11 = leerOpcionesT11(block.configuracion);
  // T11: opciones nuevas dentro de `configuracion` (el tipo de `@lumina/types` aún no las trae).
  const updateT11 = (parche: Partial<ReturnType<typeof leerOpcionesT11>>) =>
    update((w) => ({
      ...w,
      configuracion: { ...w.configuracion, ...parche } as FlipCardsConfigT11,
    }));

  const applyPlantilla = (id: FlipCardsPlantillaId) => {
    update((w) => applyFlipCardsPlantilla(w, id));
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-2">
        <WidgetSectionTitle>Plantilla de diseño</WidgetSectionTitle>
        <p className="text-[11px] leading-snug text-muted-foreground">
          Aplica colores y estilo visual. El texto de las tarjetas no se modifica.
        </p>
        <FlipCardsTemplateGallery
          activeId={activePlantillaId}
          onSelect={applyPlantilla}
        />
      </div>

      <CollapsibleSection
        title="Layout"
        storageKey="flip-cards.layout"
        badge={`${countDraft} tarjetas`}
      >
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Número de tarjetas</Label>
            <span className="text-xs tabular-nums text-muted-foreground">{countDraft}</span>
          </div>
          <Slider
            value={[countDraft]}
            min={2}
            max={12}
            step={1}
            onValueChange={([v]) => setCardCount(v)}
          >
            <SliderThumb />
          </Slider>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Columnas</Label>
          <div className="flex gap-1">
            {([2, 3, 4] as const).map((col) => (
              <Button
                key={col}
                type="button"
                size="sm"
                variant={configuracion.columnas === col ? 'secondary' : 'outline'}
                className="flex-1 text-xs"
                onClick={() =>
                  update((w) => ({
                    ...w,
                    configuracion: { ...w.configuracion, columnas: col },
                  }))
                }
              >
                {col}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Espacio entre tarjetas</Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {configuracion.espacioEntreTarjetas}px
            </span>
          </div>
          <Slider
            value={[configuracion.espacioEntreTarjetas]}
            min={4}
            max={32}
            step={2}
            onValueChange={([v]) =>
              update((w) => ({
                ...w,
                configuracion: { ...w.configuracion, espacioEntreTarjetas: v },
              }))
            }
          >
            <SliderThumb />
          </Slider>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Padding contenedor</Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {configuracion.paddingContenedor}px
            </span>
          </div>
          <Slider
            value={[configuracion.paddingContenedor]}
            min={8}
            max={48}
            step={4}
            onValueChange={([v]) =>
              update((w) => ({
                ...w,
                configuracion: { ...w.configuracion, paddingContenedor: v },
              }))
            }
          >
            <SliderThumb />
          </Slider>
        </div>
      </CollapsibleSection>

      {hideComponentes ? null : (
        <FlipCardsWidgetComponentes block={block} applyNow={applyNow} />
      )}

      <CollapsibleSection
        title="Visibilidad por defecto"
        defaultOpen={false}
        storageKey="flip-cards.visibilidad"
      >
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          Cómo se aplica
          <FieldHelp label="Visibilidad por defecto">
            <p>
              Aplica a tarjetas nuevas o a las que no tengan un valor propio. Para una tarjeta
              concreta, selecciónala en el lienzo y usa la sección «Tarjeta» arriba.
            </p>
          </FieldHelp>
        </div>
        <CaraCheckboxes
          label="Frente"
          cara={configuracion.frente}
          onChange={(patch) =>
            update((w) => ({
              ...w,
              configuracion: {
                ...w.configuracion,
                frente: {
                  ...(w.configuracion.frente ?? DEFAULT_FLIP_CARDS_CONFIG.frente),
                  ...patch,
                },
              },
            }))
          }
        />
        <CaraCheckboxes
          label="Reverso"
          cara={configuracion.reverso}
          onChange={(patch) =>
            update((w) => ({
              ...w,
              configuracion: {
                ...w.configuracion,
                reverso: {
                  ...(w.configuracion.reverso ?? DEFAULT_FLIP_CARDS_CONFIG.reverso),
                  ...patch,
                },
              },
            }))
          }
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Animación"
        defaultOpen={false}
        storageKey="flip-cards.animacion"
      >
        <PresetGallery
          presets={presetsDelWidget('flip-cards')?.filter((p) =>
            FLIP_CARDS_ESTILOS_T11_IDS.has(p.id),
          )}
          estado={block}
          storageKey="widget.flip-cards.estilos"
          onSelect={(preset) =>
            update((w) => aplicarPreset(normalizeFlipCardsWidget(w), preset))
          }
        />
        <div className="space-y-1.5">
          <Label className="text-xs">Modo</Label>
          <div className="flex gap-1">
            {(
              [
                ['cuadricula', 'Cuadrícula'],
                ['mazo', 'Mazo'],
              ] as [FlipCardsModo, string][]
            ).map(([id, label]) => (
              <Button
                key={id}
                type="button"
                size="sm"
                variant={opcionesT11.modo === id ? 'primary' : 'outline'}
                className="h-8 flex-1 text-xs"
                onClick={() => updateT11({ modo: id })}
              >
                {label}
              </Button>
            ))}
          </div>
          {opcionesT11.modo === 'mazo' ? (
            <p className="text-[11px] text-muted-foreground">
              Una tarjeta a la vez; el alumno desliza o usa las flechas.
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Tipo de giro</Label>
          <div className="grid grid-cols-2 gap-1">
            {FLIP_CARDS_GIROS.map((g) => (
              <Button
                key={g.id}
                type="button"
                size="sm"
                variant={opcionesT11.giro === g.id ? 'primary' : 'outline'}
                className="h-8 text-xs"
                onClick={() => updateT11({ giro: g.id as FlipCardsGiro })}
              >
                {g.label}
              </Button>
            ))}
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox
            checked={opcionesT11.profundidad}
            onCheckedChange={(v) => updateT11({ profundidad: v === true })}
          />
          Profundidad 3D (más perspectiva y sombra)
        </label>
        {opcionesT11.modo === 'cuadricula' ? (
          <label className="flex cursor-pointer items-center gap-2 text-xs">
            <Checkbox
              checked={opcionesT11.entradaEscalonada}
              onCheckedChange={(v) => updateT11({ entradaEscalonada: v === true })}
            />
            Entrada escalonada de las tarjetas
          </label>
        ) : null}
      </CollapsibleSection>

      <FlipCardsAppearanceProperties block={block} applyNow={applyNow} />
    </div>
  );
}
