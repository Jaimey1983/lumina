'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider, SliderThumb } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  clipShapeLabel,
  clampClipImageOffsetsForBlock,
  normalizeClipContentImage,
} from '@/lib/clip-path';
import {
  appendMaskNode,
  createDefaultLibreShape,
  removeLastMaskNode,
  resolveFreeformPath,
} from '@/lib/freeform-mask';
import type {
  Block,
  ClipContent,
  ClipContentImage,
  ClipGroupBlock,
  ClipShape,
  ClipShapeKind,
  ClipShapeLibre,
} from '@/types/slide.types';
import { BLOCK_FALLBACKS } from '@/types/slide.types';

interface Props {
  block: ClipGroupBlock;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
  scheduleApply: (fn: (b: Block) => Block) => void;
  clearDebounce: () => void;
}

const SHAPE_OPTIONS: { value: ClipShapeKind; label: string }[] = [
  { value: 'rectangulo', label: 'Rectángulo' },
  { value: 'circulo', label: 'Círculo' },
  { value: 'elipse', label: 'Elipse' },
  { value: 'triangulo', label: 'Triángulo' },
  { value: 'estrella', label: 'Estrella' },
  { value: 'hexagono', label: 'Hexágono' },
  { value: 'poligono', label: 'Polígono' },
  { value: 'libre', label: 'Forma libre' },
  { value: 'svg', label: 'SVG personalizado' },
];

function defaultShape(kind: ClipShapeKind, prev?: ClipShape): ClipShape {
  switch (kind) {
    case 'rectangulo':
      return {
        tipo: 'rectangulo',
        borderRadius:
          prev?.tipo === 'rectangulo' ? prev.borderRadius : 0,
      };
    case 'circulo':
      return { tipo: 'circulo' };
    case 'elipse':
      return { tipo: 'elipse' };
    case 'triangulo':
      return { tipo: 'triangulo' };
    case 'estrella':
      return {
        tipo: 'estrella',
        puntas: prev?.tipo === 'estrella' ? prev.puntas ?? 5 : 5,
        radioInterno:
          prev?.tipo === 'estrella' ? prev.radioInterno ?? 0.4 : 0.4,
      };
    case 'hexagono':
      return { tipo: 'hexagono' };
    case 'poligono':
      return {
        tipo: 'poligono',
        lados: prev?.tipo === 'poligono' ? prev.lados : 6,
      };
    case 'svg':
      return {
        tipo: 'svg',
        path:
          prev?.tipo === 'svg'
            ? prev.path
            : 'M 0.1,0.1 L 0.9,0.1 L 0.5,0.9 Z',
      };
    case 'libre':
      return prev?.tipo === 'libre' ? prev : createDefaultLibreShape();
    default:
      return { tipo: 'rectangulo' };
  }
}

export function ClipGroupBlockFields({ block, applyNow, scheduleApply, clearDebounce }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [opLocal, setOpLocal] = useState(() => block.opacidad ?? 100);
  const [contentKind, setContentKind] = useState<'color' | 'gradiente' | 'imagen'>(
    block.contenido.tipo,
  );
  const [urlDraft, setUrlDraft] = useState(() =>
    block.contenido.tipo === 'imagen' ? block.contenido.url : '',
  );

  useEffect(() => {
    setOpLocal(block.opacidad ?? 100);
    setContentKind(block.contenido.tipo);
    setUrlDraft(block.contenido.tipo === 'imagen' ? block.contenido.url : '');
  }, [block.opacidad, block.contenido]);

  const patchShape = (shape: ClipShape) => {
    void applyNow((b) =>
      b.tipo === 'clip-group' ? { ...b, clipShape: shape } : b,
    );
  };

  const patchContent = (content: ClipContent) => {
    void applyNow((b) =>
      b.tipo === 'clip-group' ? { ...b, contenido: content } : b,
    );
  };

  const clampImageContent = (
    b: ClipGroupBlock,
    patch: Partial<ClipContentImage>,
  ): ClipContentImage => {
    if (b.contenido.tipo !== 'imagen') {
      return normalizeClipContentImage({ tipo: 'imagen', url: '', ...patch });
    }
    const ancho = b.ancho ?? BLOCK_FALLBACKS.clipGroup.ancho;
    const alto = b.alto ?? BLOCK_FALLBACKS.clipGroup.alto;
    const merged = { ...normalizeClipContentImage(b.contenido), ...patch };
    const clamped = clampClipImageOffsetsForBlock(merged, ancho, alto);
    return { ...merged, ...clamped };
  };

  const scheduleImagePatch = (patch: Partial<ClipContentImage>) => {
    scheduleApply((b) =>
      b.tipo === 'clip-group' && b.contenido.tipo === 'imagen'
        ? { ...b, contenido: clampImageContent(b, patch) }
        : b,
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <p className="text-xs font-medium text-foreground">Máscara de recorte</p>
        <p className="text-[11px] text-muted-foreground">
          Forma actual: {clipShapeLabel(block.clipShape)}
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Forma</Label>
        <Select
          value={block.clipShape.tipo}
          onValueChange={(v) => {
            patchShape(defaultShape(v as ClipShapeKind, block.clipShape));
          }}
        >
          <SelectTrigger size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SHAPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {block.clipShape.tipo === 'rectangulo' ? (
        <div className="space-y-2">
          <Label className="text-xs">
            Radio de esquina ({block.clipShape.borderRadius ?? 0}%)
          </Label>
          <Slider
            min={0}
            max={50}
            step={1}
            value={[block.clipShape.borderRadius ?? 0]}
            onValueChange={([v]) => {
              const n = Math.round(v!);
              scheduleApply((b) =>
                b.tipo === 'clip-group' && b.clipShape.tipo === 'rectangulo'
                  ? { ...b, clipShape: { ...b.clipShape, borderRadius: n } }
                  : b,
              );
            }}
          >
            <SliderThumb />
          </Slider>
        </div>
      ) : null}

      {block.clipShape.tipo === 'poligono' ? (
        <div className="space-y-2">
          <Label className="text-xs">Lados ({block.clipShape.lados})</Label>
          <Slider
            min={3}
            max={12}
            step={1}
            value={[block.clipShape.lados]}
            onValueChange={([v]) => {
              const n = Math.round(v!);
              scheduleApply((b) =>
                b.tipo === 'clip-group' && b.clipShape.tipo === 'poligono'
                  ? { ...b, clipShape: { ...b.clipShape, lados: n } }
                  : b,
              );
            }}
          >
            <SliderThumb />
          </Slider>
        </div>
      ) : null}

      {block.clipShape.tipo === 'estrella' ? (
        <>
          <div className="space-y-2">
            <Label className="text-xs">Puntas ({block.clipShape.puntas ?? 5})</Label>
            <Slider
              min={3}
              max={12}
              step={1}
              value={[block.clipShape.puntas ?? 5]}
              onValueChange={([v]) => {
                const n = Math.round(v!);
                scheduleApply((b) =>
                  b.tipo === 'clip-group' && b.clipShape.tipo === 'estrella'
                    ? { ...b, clipShape: { ...b.clipShape, puntas: n } }
                    : b,
                );
              }}
            >
              <SliderThumb />
            </Slider>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Radio interno</Label>
            <Slider
              min={0.1}
              max={0.9}
              step={0.05}
              value={[block.clipShape.radioInterno ?? 0.4]}
              onValueChange={([v]) => {
                scheduleApply((b) =>
                  b.tipo === 'clip-group' && b.clipShape.tipo === 'estrella'
                    ? { ...b, clipShape: { ...b.clipShape, radioInterno: v! } }
                    : b,
                );
              }}
            >
              <SliderThumb />
            </Slider>
          </div>
        </>
      ) : null}

      {block.clipShape.tipo === 'libre'
        ? (() => {
            const freeform = resolveFreeformPath(block.clipShape as ClipShapeLibre);
            return (
              <div className="space-y-2 rounded-md border border-border bg-muted/20 p-2">
                <p className="text-[11px] text-muted-foreground">
                  Arrastra los nodos azules. Doble clic en un nodo (o Alt+arrastrarlo)
                  saca las manijas naranjas, que luego se mueven independientes.
                  El tirador verde de cada esquina la redondea (esquina viva).
                  Clic sobre el borde añade un nodo; Alt+clic o Supr lo elimina.
                  Shift al mover una manija ajusta el ángulo.
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() =>
                      patchShape({ tipo: 'libre', path: appendMaskNode(freeform) })
                    }
                  >
                    Añadir nodo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    disabled={freeform.nodes.length <= 3}
                    onClick={() =>
                      patchShape({
                        tipo: 'libre',
                        path: removeLastMaskNode(freeform),
                      })
                    }
                  >
                    Quitar nodo
                  </Button>
                </div>
              </div>
            );
          })()
        : null}

      {block.clipShape.tipo === 'svg' ? (
        <div className="space-y-2">
          <Label className="text-xs" htmlFor="clip-svg-path">
            Path SVG (0–1)
          </Label>
          <textarea
            id="clip-svg-path"
            className="min-h-[80px] w-full rounded-md border border-input bg-background px-2 py-1.5 font-mono text-[11px]"
            value={block.clipShape.path}
            onChange={(e) => {
              const path = e.target.value;
              scheduleApply((b) =>
                b.tipo === 'clip-group' && b.clipShape.tipo === 'svg'
                  ? { ...b, clipShape: { ...b.clipShape, path } }
                  : b,
              );
            }}
          />
        </div>
      ) : null}

      <div className="space-y-2 border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Opacidad ({opLocal}%)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 px-2 text-[10px]"
            onClick={() => {
              const n = opLocal > 0 ? 0 : 100;
              setOpLocal(n);
              void applyNow((b) =>
                b.tipo === 'clip-group' ? { ...b, opacidad: n } : b,
              );
            }}
          >
            {opLocal > 0 ? 'Transparente' : 'Restaurar'}
          </Button>
        </div>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[opLocal]}
          onValueChange={([v]) => {
            const n = Math.round(v!);
            setOpLocal(n);
            scheduleApply((b) =>
              b.tipo === 'clip-group' ? { ...b, opacidad: n } : b,
            );
          }}
        >
          <SliderThumb />
        </Slider>
      </div>

      <div className="space-y-2 border-t border-border pt-3">
        <Label className="text-xs">Contenido</Label>
        <Select
          value={contentKind}
          onValueChange={(v) => {
            const kind = v as 'color' | 'gradiente' | 'imagen';
            setContentKind(kind);
            if (kind === 'color') {
              patchContent({ tipo: 'color', valor: '#94a3b8' });
            } else if (kind === 'gradiente') {
              patchContent({
                tipo: 'gradiente',
                inicio: '#6366f1',
                fin: '#ec4899',
                direccion: 135,
              });
            } else {
              setUrlDraft('');
              patchContent({
                tipo: 'imagen',
                url: '',
                offsetX: 0,
                offsetY: 0,
                escala: 1,
                ajuste: 'cubrir',
              });
            }
          }}
        >
          <SelectTrigger size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="color">Color sólido</SelectItem>
            <SelectItem value="gradiente">Gradiente</SelectItem>
            <SelectItem value="imagen">Imagen</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {block.contenido.tipo === 'color' ? (
        <div className="space-y-2">
          <Label className="text-xs" htmlFor="clip-fill-color">
            Color de relleno
          </Label>
          <Input
            id="clip-fill-color"
            type="color"
            value={block.contenido.valor}
            className="h-8 w-full cursor-pointer p-1"
            onChange={(e) =>
              patchContent({ tipo: 'color', valor: e.target.value })
            }
          />
        </div>
      ) : null}

      {block.contenido.tipo === 'gradiente' ? (
        <div className="space-y-2">
          <Label className="text-xs">Gradiente</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={block.contenido.inicio}
              className="h-8 flex-1 cursor-pointer p-1"
              onChange={(e) =>
                patchContent({
                  tipo: 'gradiente',
                  inicio: e.target.value,
                  fin: block.contenido.tipo === 'gradiente' ? block.contenido.fin : '#ec4899',
                  direccion:
                    block.contenido.tipo === 'gradiente'
                      ? block.contenido.direccion
                      : 135,
                })
              }
            />
            <Input
              type="color"
              value={block.contenido.fin}
              className="h-8 flex-1 cursor-pointer p-1"
              onChange={(e) =>
                patchContent({
                  tipo: 'gradiente',
                  inicio:
                    block.contenido.tipo === 'gradiente'
                      ? block.contenido.inicio
                      : '#6366f1',
                  fin: e.target.value,
                  direccion:
                    block.contenido.tipo === 'gradiente'
                      ? block.contenido.direccion
                      : 135,
                })
              }
            />
          </div>
        </div>
      ) : null}

      {block.contenido.tipo === 'imagen' ? (
        <div className="space-y-2">
          <Label className="text-xs" htmlFor="clip-img-url">
            URL de imagen
          </Label>
          <Input
            id="clip-img-url"
            type="url"
            value={urlDraft}
            placeholder="https://…"
            onChange={(e) => {
              const v = e.target.value;
              setUrlDraft(v);
              scheduleApply((b) =>
                b.tipo === 'clip-group' && b.contenido.tipo === 'imagen'
                  ? {
                      ...b,
                      contenido: { ...b.contenido, url: v },
                    }
                  : b,
              );
            }}
            onBlur={() => {
              clearDebounce();
              void applyNow((b) =>
                b.tipo === 'clip-group' && b.contenido.tipo === 'imagen'
                  ? {
                      ...b,
                      contenido: { ...b.contenido, url: urlDraft.trim() },
                    }
                  : b,
              );
            }}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData('text').trim();
              if (!pasted) return;
              e.preventDefault();
              setUrlDraft(pasted);
              clearDebounce();
              void applyNow((b) =>
                b.tipo === 'clip-group' && b.contenido.tipo === 'imagen'
                  ? {
                      ...b,
                      contenido: { ...b.contenido, url: pasted },
                    }
                  : b,
              );
            }}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                const url = String(reader.result ?? '').trim();
                if (!url) return;
                setUrlDraft(url);
                void applyNow((b) =>
                  b.tipo === 'clip-group' && b.contenido.tipo === 'imagen'
                    ? { ...b, contenido: { ...b.contenido, url } }
                    : b,
                );
              };
              reader.readAsDataURL(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => fileRef.current?.click()}
          >
            Subir imagen
          </Button>
          <p className="text-[10px] text-muted-foreground">
            Selecciona la máscara en el lienzo para arrastrar la imagen o usa la rueda para escalar.
          </p>
          <div className="space-y-2 rounded-md border border-border bg-muted/20 p-2">
            <Label className="text-xs">Ajuste</Label>
            <Select
              value={block.contenido.ajuste ?? 'cubrir'}
              onValueChange={(v) => {
                if (block.contenido.tipo !== 'imagen') return;
                const ajuste = v as 'cubrir' | 'contener' | 'llenar';
                patchContent(clampImageContent(block, { ajuste }));
              }}
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cubrir">Cubrir</SelectItem>
                <SelectItem value="contener">Contener</SelectItem>
                <SelectItem value="llenar">Llenar (estirar)</SelectItem>
              </SelectContent>
            </Select>
            <Label className="text-xs">
              Escala ({Math.round((block.contenido.escala ?? 1) * 100)}%)
            </Label>
            <Slider
              min={0.25}
              max={4}
              step={0.05}
              value={[block.contenido.escala ?? 1]}
              onValueChange={([v]) => {
                scheduleImagePatch({ escala: v! });
              }}
            >
              <SliderThumb />
            </Slider>
            <Label className="text-xs">
              Desplazamiento X ({Math.round(block.contenido.offsetX ?? 0)}%)
            </Label>
            <Slider
              min={-100}
              max={100}
              step={1}
              value={[block.contenido.offsetX ?? 0]}
              onValueChange={([v]) => {
                scheduleImagePatch({ offsetX: Math.round(v!) });
              }}
            >
              <SliderThumb />
            </Slider>
            <Label className="text-xs">
              Desplazamiento Y ({Math.round(block.contenido.offsetY ?? 0)}%)
            </Label>
            <Slider
              min={-100}
              max={100}
              step={1}
              value={[block.contenido.offsetY ?? 0]}
              onValueChange={([v]) => {
                scheduleImagePatch({ offsetY: Math.round(v!) });
              }}
            >
              <SliderThumb />
            </Slider>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label className="text-xs" htmlFor="clip-border-color">
          Borde
        </Label>
        <Input
          id="clip-border-color"
          type="color"
          value={block.borde?.color ?? '#475569'}
          className="h-8 w-full cursor-pointer p-1"
          onChange={(e) => {
            void applyNow((b) =>
              b.tipo === 'clip-group'
                ? {
                    ...b,
                    borde: {
                      ...b.borde,
                      color: e.target.value,
                      grosor: b.borde?.grosor ?? 2,
                    },
                  }
                : b,
            );
          }}
        />
        <Label className="text-xs">
          Grosor del borde ({block.borde?.grosor ?? 2}px)
        </Label>
        <Slider
          min={0}
          max={12}
          step={1}
          value={[block.borde?.grosor ?? 2]}
          onValueChange={([v]) => {
            const grosor = Math.round(v!);
            scheduleApply((b) =>
              b.tipo === 'clip-group'
                ? {
                    ...b,
                    borde: {
                      color: b.borde?.color ?? '#475569',
                      grosor,
                    },
                  }
                : b,
            );
          }}
        >
          <SliderThumb />
        </Slider>
      </div>

      <div className="space-y-2 border-t border-border pt-3">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs">Sombra</Label>
          <Switch
            checked={Boolean(block.sombra)}
            onCheckedChange={(checked) => {
              void applyNow((b) =>
                b.tipo === 'clip-group'
                  ? {
                      ...b,
                      sombra: checked
                        ? {
                            color: '#000000',
                            blur: 8,
                            offsetX: 0,
                            offsetY: 4,
                          }
                        : undefined,
                    }
                  : b,
              );
            }}
          />
        </div>
        {block.sombra ? (
          <>
            <Input
              type="color"
              value={
                block.sombra.color?.startsWith('#')
                  ? block.sombra.color
                  : '#000000'
              }
              className="h-8 w-full cursor-pointer p-1"
              onChange={(e) => {
                scheduleApply((b) =>
                  b.tipo === 'clip-group' && b.sombra
                    ? {
                        ...b,
                        sombra: { ...b.sombra, color: e.target.value },
                      }
                    : b,
                );
              }}
            />
            <Label className="text-xs">Desplazamiento X ({block.sombra.offsetX ?? 0}px)</Label>
            <Slider
              min={-24}
              max={24}
              step={1}
              value={[block.sombra.offsetX ?? 0]}
              onValueChange={([v]) => {
                scheduleApply((b) =>
                  b.tipo === 'clip-group' && b.sombra
                    ? { ...b, sombra: { ...b.sombra, offsetX: Math.round(v!) } }
                    : b,
                );
              }}
            >
              <SliderThumb />
            </Slider>
            <Label className="text-xs">Desplazamiento Y ({block.sombra.offsetY ?? 0}px)</Label>
            <Slider
              min={-24}
              max={24}
              step={1}
              value={[block.sombra.offsetY ?? 0]}
              onValueChange={([v]) => {
                scheduleApply((b) =>
                  b.tipo === 'clip-group' && b.sombra
                    ? { ...b, sombra: { ...b.sombra, offsetY: Math.round(v!) } }
                    : b,
                );
              }}
            >
              <SliderThumb />
            </Slider>
            <Label className="text-xs">Difuminado ({block.sombra.blur ?? 8}px)</Label>
            <Slider
              min={0}
              max={32}
              step={1}
              value={[block.sombra.blur ?? 8]}
              onValueChange={([v]) => {
                scheduleApply((b) =>
                  b.tipo === 'clip-group' && b.sombra
                    ? { ...b, sombra: { ...b.sombra, blur: Math.round(v!) } }
                    : b,
                );
              }}
            >
              <SliderThumb />
            </Slider>
          </>
        ) : null}
      </div>
    </div>
  );
}
