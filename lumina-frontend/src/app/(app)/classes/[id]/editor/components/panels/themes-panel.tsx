'use client';

import { useCallback, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FontFamilySelect } from '@/components/editor/font-family-select';
import type { Slide as ApiSlide } from '@/hooks/api/use-class';
import {
  createEmptyCustomTheme,
  backgroundToCssStyle,
  NO_SLIDE_THEME,
  NO_SLIDE_THEME_ID,
  PREDEFINED_SLIDE_THEMES,
} from '@/lib/slide-themes';
import { cn } from '@/lib/utils';
import type { SlideTheme } from '@/types/slide.types';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SlideThemesPanelProps {
  activeSlide: ApiSlide | null;
  activeTemaId?: string;
  customThemes: SlideTheme[];
  isSaving?: boolean;
  onApplyToCurrentSlide: (theme: SlideTheme) => void;
  onApplyToAllSlides: (theme: SlideTheme) => void;
  onSaveCustomThemes: (themes: SlideTheme[]) => void;
}

type PanelMode = 'browse' | 'edit-custom';

const ALL_PREDEFINED = [NO_SLIDE_THEME, ...PREDEFINED_SLIDE_THEMES];

function isThemeActive(theme: SlideTheme, activeTemaId?: string): boolean {
  if (theme.id === NO_SLIDE_THEME_ID) return !activeTemaId;
  return activeTemaId === theme.id;
}

// ─── Miniatura ────────────────────────────────────────────────────────────────

function ThemeThumbnail({
  theme,
  isActive,
  selected,
  onSelect,
  onEdit,
}: {
  theme: SlideTheme;
  isActive: boolean;
  selected: boolean;
  onSelect: () => void;
  onEdit?: () => void;
}) {
  const isNone = theme.id === NO_SLIDE_THEME_ID;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'flex w-full flex-col overflow-hidden rounded-md text-left transition-opacity hover:opacity-90',
          isActive ? 'ring-2 ring-[#2563EB] ring-offset-1' : 'ring-1 ring-[#e5e7eb]',
          selected && !isActive && 'ring-2 ring-[#93C5FD] ring-offset-1',
          isNone && 'border border-dashed border-[#d1d5db]',
        )}
        style={{ width: 120, height: 68 }}
        aria-pressed={isActive}
        title={theme.nombre}
      >
        <div
          className="flex min-h-0 flex-1 flex-col justify-center px-2 py-1.5"
          style={
            isNone
              ? {
                  backgroundColor: '#FFFFFF',
                  fontFamily: theme.fuente,
                  color: theme.colores.textoSecundario,
                }
              : {
                  ...backgroundToCssStyle(theme.fondo),
                  fontFamily: theme.fuente,
                  color: theme.colores.texto,
                }
          }
        >
          <span className="truncate text-[10px] font-semibold leading-tight">{theme.nombre}</span>
        </div>
        {!isNone ? (
          <span
            className="block h-2 w-full shrink-0"
            style={{ backgroundColor: theme.colores.acento }}
            aria-hidden
          />
        ) : (
          <span className="block h-2 w-full shrink-0 bg-[#e5e7eb]" aria-hidden />
        )}
      </button>
      {onEdit ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="absolute right-1 top-1 flex size-5 items-center justify-center rounded bg-white/90 text-[#374151] shadow hover:bg-white"
          aria-label={`Editar ${theme.nombre}`}
        >
          <Pencil className="size-3" />
        </button>
      ) : null}
    </div>
  );
}

// ─── Selector de alcance (inline) ─────────────────────────────────────────────

function ThemeScopeActions({
  theme,
  disabled,
  onApplyCurrent,
  onApplyAll,
  onCancel,
}: {
  theme: SlideTheme;
  disabled?: boolean;
  onApplyCurrent: () => void;
  onApplyAll: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-md border border-[#e5e7eb] bg-[#f9fafb] p-2">
      <p className="mb-2 text-xs font-medium text-foreground">
        {theme.id === NO_SLIDE_THEME_ID
          ? 'Quitar tema'
          : `Aplicar «${theme.nombre}»`}
      </p>
      <div className="flex flex-col gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full justify-start text-xs"
          disabled={disabled}
          onClick={onApplyCurrent}
        >
          Aplicar a este slide
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full justify-start text-xs"
          disabled={disabled}
          onClick={onApplyAll}
        >
          Aplicar a todos los slides
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="w-full text-xs text-muted-foreground"
          disabled={disabled}
          onClick={onCancel}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}

// ─── Formulario tema personalizado ────────────────────────────────────────────

function CustomThemeForm({
  draft,
  isNew,
  disabled,
  onChange,
  onSave,
  onDelete,
  onCancel,
}: {
  draft: SlideTheme;
  isNew: boolean;
  disabled?: boolean;
  onChange: (next: SlideTheme) => void;
  onSave: () => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const solidHex =
    draft.fondo.tipo === 'color' ? draft.fondo.valor : draft.colores.fondo;

  const setSolidFondo = (hex: string) => {
    onChange({
      ...draft,
      fondo: { tipo: 'color', valor: hex },
      colores: { ...draft.colores, fondo: hex },
    });
  };

  const applyGradient = (inicio: string, fin: string) => {
    onChange({
      ...draft,
      fondo: { tipo: 'gradiente', inicio, fin, direccion: 135 },
    });
  };

  return (
    <div className="flex flex-col gap-3 border-t border-[#e5e7eb] pt-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-foreground">
          {isNew ? 'Nuevo tema' : 'Editar tema'}
        </h3>
        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={onCancel}>
          Volver
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Nombre</Label>
        <Input
          value={draft.nombre}
          onChange={(e) => onChange({ ...draft, nombre: e.target.value })}
          disabled={disabled}
          className="h-8 text-xs"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Fondo (color sólido)</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            className="h-9 w-14 cursor-pointer p-1"
            value={solidHex.startsWith('#') ? solidHex : `#${solidHex}`}
            onChange={(e) => setSolidFondo(e.target.value)}
            disabled={disabled}
          />
          <Input
            value={solidHex}
            onChange={(e) => setSolidFondo(e.target.value)}
            disabled={disabled}
            className="h-8 flex-1 text-xs"
          />
        </div>
        <div className="grid grid-cols-2 gap-1">
          {[
            { inicio: '#0ea5e9', fin: '#6366f1', label: 'Azul' },
            { inicio: '#f97316', fin: '#ec4899', label: 'Atardecer' },
          ].map((g) => (
            <Button
              key={g.label}
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-[10px]"
              disabled={disabled}
              onClick={() => applyGradient(g.inicio, g.fin)}
            >
              {g.label}
            </Button>
          ))}
        </div>
      </div>

      <FontFamilySelect
        value={draft.fuente}
        onValueChange={(v) => onChange({ ...draft, fuente: v })}
        disabled={disabled}
        labelClassName="text-muted-foreground"
      />

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Texto principal</Label>
          <Input
            type="color"
            className="h-9 w-full cursor-pointer p-1"
            value={draft.colores.texto}
            onChange={(e) =>
              onChange({
                ...draft,
                colores: { ...draft.colores, texto: e.target.value },
              })
            }
            disabled={disabled}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Color acento</Label>
          <Input
            type="color"
            className="h-9 w-full cursor-pointer p-1"
            value={draft.colores.acento}
            onChange={(e) =>
              onChange({
                ...draft,
                colores: { ...draft.colores, acento: e.target.value },
              })
            }
            disabled={disabled}
          />
        </div>
      </div>

      <Button type="button" size="sm" className="w-full" disabled={disabled} onClick={onSave}>
        Guardar tema
      </Button>
      {!isNew ? (
        <Button
          type="button"
          size="sm"
          variant="destructive"
          className="w-full"
          disabled={disabled}
          onClick={onDelete}
        >
          Eliminar
        </Button>
      ) : null}
    </div>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────────────

export function SlideThemesPanel({
  activeSlide,
  activeTemaId,
  customThemes,
  isSaving,
  onApplyToCurrentSlide,
  onApplyToAllSlides,
  onSaveCustomThemes,
}: SlideThemesPanelProps) {
  const [mode, setMode] = useState<PanelMode>('browse');
  const [draft, setDraft] = useState<SlideTheme | null>(null);
  const [isNewDraft, setIsNewDraft] = useState(false);
  const [pendingTheme, setPendingTheme] = useState<SlideTheme | null>(null);

  const disabled = isSaving || !activeSlide;

  const startCreate = useCallback(() => {
    setPendingTheme(null);
    setDraft(createEmptyCustomTheme());
    setIsNewDraft(true);
    setMode('edit-custom');
  }, []);

  const startEdit = useCallback((theme: SlideTheme) => {
    setPendingTheme(null);
    setDraft({ ...theme });
    setIsNewDraft(false);
    setMode('edit-custom');
  }, []);

  const handleSaveDraft = useCallback(() => {
    if (!draft?.nombre.trim()) {
      toast.error('El nombre del tema es obligatorio');
      return;
    }
    const next = customThemes.filter((t) => t.id !== draft.id);
    onSaveCustomThemes([...next, { ...draft, esPersonalizado: true }]);
    setMode('browse');
    setDraft(null);
    toast.success('Tema guardado');
  }, [customThemes, draft, onSaveCustomThemes]);

  const handleDeleteDraft = useCallback(() => {
    if (!draft) return;
    onSaveCustomThemes(customThemes.filter((t) => t.id !== draft.id));
    setMode('browse');
    setDraft(null);
    toast.success('Tema eliminado');
  }, [customThemes, draft, onSaveCustomThemes]);

  if (mode === 'edit-custom' && draft) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <CustomThemeForm
          draft={draft}
          isNew={isNewDraft}
          disabled={isSaving}
          onChange={setDraft}
          onSave={handleSaveDraft}
          onDelete={handleDeleteDraft}
          onCancel={() => {
            setMode('browse');
            setDraft(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
          Predefinidos
        </h2>
        <div className="grid grid-cols-2 justify-items-center gap-3">
          {ALL_PREDEFINED.map((theme) => (
            <ThemeThumbnail
              key={theme.id}
              theme={theme}
              isActive={isThemeActive(theme, activeTemaId)}
              selected={pendingTheme?.id === theme.id}
              onSelect={() => setPendingTheme(theme)}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
            Personalizados
          </h2>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7 shrink-0"
            aria-label="Crear tema personalizado"
            onClick={startCreate}
          >
            <Plus className="size-3.5" />
          </Button>
        </div>

        {customThemes.length === 0 ? (
          <p className="py-2 text-center text-xs text-[#9ca3af]">
            Crea tu primer tema personalizado
          </p>
        ) : (
          <div className="grid grid-cols-2 justify-items-center gap-3">
            {customThemes.map((theme) => (
              <ThemeThumbnail
                key={theme.id}
                theme={theme}
                isActive={isThemeActive(theme, activeTemaId)}
                selected={pendingTheme?.id === theme.id}
                onSelect={() => setPendingTheme(theme)}
                onEdit={() => startEdit(theme)}
              />
            ))}
          </div>
        )}
      </section>

      {pendingTheme ? (
        <ThemeScopeActions
          theme={pendingTheme}
          disabled={disabled}
          onApplyCurrent={() => {
            onApplyToCurrentSlide(pendingTheme);
            setPendingTheme(null);
          }}
          onApplyAll={() => {
            onApplyToAllSlides(pendingTheme);
            setPendingTheme(null);
          }}
          onCancel={() => setPendingTheme(null)}
        />
      ) : (
        <p className="text-center text-[10px] text-[#9ca3af]">
          Toca un tema para elegir dónde aplicarlo
        </p>
      )}
    </div>
  );
}

/** @deprecated Usar `SlideThemesPanel`. */
export function ThemesPanel(props: SlideThemesPanelProps) {
  return <SlideThemesPanel {...props} />;
}
