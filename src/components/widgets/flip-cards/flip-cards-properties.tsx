'use client';

import { useEffect, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
} from 'lucide-react';

import type { Block, FlipCard, FlipCardsWidget } from '@/types/slide.types';
import { createDefaultFlipCard } from '@/lib/flip-cards-defaults';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider, SliderThumb } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toggle } from '@/components/ui/toggle';

import {
  DEFAULT_FLIP_CARDS_CONFIG,
  normalizeFlipCardsWidget,
  type FlipCardsAlineacion,
  type FlipCardsCaraConfig,
  type FlipCardsPlantillaId,
} from './flip-cards-config';
import { FlipCardsTemplateGallery } from './flip-cards-template-gallery';
import {
  applyFlipCardsPlantilla,
  resolveFlipCardsPlantillaId,
} from './flip-cards-templates';

function toHexColor(value: string | undefined, fallback: string): string {
  if (value && /^#[0-9A-Fa-f]{6}$/.test(value)) return value;
  return fallback;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

function ColorField({
  id,
  label,
  value,
  fallback,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  fallback: string;
  onChange: (hex: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Input
        id={id}
        type="color"
        value={toHexColor(value, fallback)}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full cursor-pointer p-1"
      />
    </div>
  );
}

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
      <SectionTitle>Componentes</SectionTitle>
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

  const applyPlantilla = (id: FlipCardsPlantillaId) => {
    update((w) => applyFlipCardsPlantilla(w, id));
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-2">
        <SectionTitle>Plantilla de diseño</SectionTitle>
        <p className="text-[11px] leading-snug text-muted-foreground">
          Aplica colores y estilo visual. El texto de las tarjetas no se modifica.
        </p>
        <FlipCardsTemplateGallery
          activeId={activePlantillaId}
          onSelect={applyPlantilla}
        />
      </div>

      <div className="space-y-3">
        <SectionTitle>Layout</SectionTitle>
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
      </div>

      {hideComponentes ? null : (
        <FlipCardsWidgetComponentes block={block} applyNow={applyNow} />
      )}

      <div className="space-y-3">
        <SectionTitle>Visibilidad por defecto</SectionTitle>
        <p className="text-[11px] leading-snug text-muted-foreground">
          Aplica a tarjetas nuevas o a las que no tengan un valor propio. Para una tarjeta
          concreta, selecciónala en el lienzo y usa la sección «Tarjeta» arriba.
        </p>
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
      </div>

      <div className="space-y-2">
        <SectionTitle>Aspecto</SectionTitle>
        <Tabs defaultValue="fondo" className="w-full">
          <TabsList variant="line" size="sm" className="w-full">
            <TabsTrigger value="fondo" className="flex-1 text-xs">
              Fondo
            </TabsTrigger>
            <TabsTrigger value="tarjeta" className="flex-1 text-xs">
              Tarjeta
            </TabsTrigger>
          </TabsList>
          <TabsContent value="fondo" className="mt-3 space-y-3">
            <ColorField
              id="fc-bg-container"
              label="Color de fondo"
              value={configuracion.colorFondoContenedor}
              fallback="#F8FAFC"
              onChange={(hex) =>
                update((w) => ({
                  ...w,
                  configuracion: { ...w.configuracion, colorFondoContenedor: hex },
                }))
              }
            />
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Opacidad fondo</Label>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {configuracion.opacidadFondoContenedor}%
                </span>
              </div>
              <Slider
                value={[configuracion.opacidadFondoContenedor]}
                min={0}
                max={100}
                step={5}
                onValueChange={([v]) =>
                  update((w) => ({
                    ...w,
                    configuracion: { ...w.configuracion, opacidadFondoContenedor: v },
                  }))
                }
              >
                <SliderThumb />
              </Slider>
            </div>
          </TabsContent>
          <TabsContent value="tarjeta" className="mt-3 space-y-3">
            <ColorField
              id="fc-color-frente"
              label="Color frente"
              value={configuracion.colorFrente}
              fallback="#FFFFFF"
              onChange={(hex) =>
                update((w) => ({
                  ...w,
                  configuracion: { ...w.configuracion, colorFrente: hex },
                }))
              }
            />
            <ColorField
              id="fc-color-reverso"
              label="Color reverso"
              value={configuracion.colorReverso}
              fallback="#2563EB"
              onChange={(hex) =>
                update((w) => ({
                  ...w,
                  configuracion: { ...w.configuracion, colorReverso: hex },
                }))
              }
            />
            <ColorField
              id="fc-borde-color"
              label="Color borde"
              value={configuracion.bordeTarjetaColor}
              fallback="#E2E8F0"
              onChange={(hex) =>
                update((w) => ({
                  ...w,
                  configuracion: { ...w.configuracion, bordeTarjetaColor: hex },
                }))
              }
            />
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Grosor borde</Label>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {configuracion.bordeTarjetaGrosor}px
                </span>
              </div>
              <Slider
                value={[configuracion.bordeTarjetaGrosor]}
                min={0}
                max={6}
                step={1}
                onValueChange={([v]) =>
                  update((w) => ({
                    ...w,
                    configuracion: { ...w.configuracion, bordeTarjetaGrosor: v },
                  }))
                }
              >
                <SliderThumb />
              </Slider>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Radio esquinas</Label>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {configuracion.bordeTarjetaRadio}px
                </span>
              </div>
              <Slider
                value={[configuracion.bordeTarjetaRadio]}
                min={0}
                max={24}
                step={2}
                onValueChange={([v]) =>
                  update((w) => ({
                    ...w,
                    configuracion: { ...w.configuracion, bordeTarjetaRadio: v },
                  }))
                }
              >
                <SliderThumb />
              </Slider>
            </div>
            <label className="flex items-center justify-between gap-2 text-xs">
              <span>Sombra</span>
              <Switch
                checked={configuracion.sombraTarjeta}
                onCheckedChange={(checked) =>
                  update((w) => ({
                    ...w,
                    configuracion: { ...w.configuracion, sombraTarjeta: checked },
                  }))
                }
              />
            </label>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
