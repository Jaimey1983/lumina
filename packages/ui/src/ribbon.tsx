'use client';

import * as React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from './lib/utils.js';
import { Popover, PopoverContent, PopoverTrigger } from './popover.js';

// ─── Contexto ─────────────────────────────────────────────────────────────────

interface RibbonContextValue {
  /** Los grupos se reducen a un botón desplegable. */
  compact: boolean;
  /** Cierra el panel flotante (cinta colapsada) o el desplegable del grupo tras ejecutar una acción. */
  closeFloating: () => void;
}

const RibbonContext = React.createContext<RibbonContextValue>({
  compact: false,
  closeFloating: () => undefined,
});

const FOCUSABLE = 'button:not([aria-disabled="true"]):not([disabled]), [href], input:not([disabled]), select:not([disabled])';

function focusables(root: HTMLElement | null): HTMLElement[] {
  return root ? Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)) : [];
}

/** Mueve el foco entre los botones de una barra con las flechas (y Inicio/Fin). Devuelve si manejó la tecla. */
function moveFocusWithArrows(e: React.KeyboardEvent<HTMLElement>): boolean {
  const horizontal = e.key === 'ArrowRight' || e.key === 'ArrowLeft';
  if (!horizontal && e.key !== 'Home' && e.key !== 'End') return false;
  // Solo entre botones: en un campo de texto o un select las flechas son del propio campo.
  if (!(document.activeElement instanceof HTMLButtonElement)) return false;
  const items = focusables(e.currentTarget).filter((el) => el instanceof HTMLButtonElement);
  const at = items.indexOf(document.activeElement);
  if (items.length === 0 || at === -1) return false;
  e.preventDefault();
  const last = items.length - 1;
  const next = e.key === 'Home' ? 0 : e.key === 'End' ? last : (at + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;
  items[next]?.focus();
  return true;
}

// ─── Botones ──────────────────────────────────────────────────────────────────

export interface RibbonButtonProps extends Omit<React.ComponentProps<'button'>, 'title' | 'children'> {
  label: string;
  icon?: React.ReactNode;
  /** Atajo en texto («Ctrl+D»): aparece en el tooltip y en `aria-keyshortcuts`. */
  shortcut?: string;
  /** `large`: icono arriba y texto debajo · `medium`: icono y texto en fila · `small`: solo icono. */
  size?: 'large' | 'medium' | 'small';
  /** Botón de dos estados (negrita, cuadrícula…): `aria-pressed`. */
  active?: boolean;
  /** Por qué está deshabilitado; se dice en el tooltip. */
  disabledReason?: string;
}

const buttonBase =
  'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md text-xs text-foreground outline-hidden transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-transparent aria-pressed:bg-accent aria-pressed:text-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0';

const buttonSize = {
  large: 'min-h-14 min-w-14 flex-col px-2 py-1.5 [&_svg]:size-6',
  medium: 'h-7 px-2',
  small: 'size-7',
} as const;

function RibbonButton({
  label,
  icon,
  shortcut,
  size = 'medium',
  active,
  disabled,
  disabledReason,
  className,
  onClick,
  type = 'button',
  ...props
}: RibbonButtonProps) {
  const { closeFloating } = React.useContext(RibbonContext);
  // `aria-disabled` y no `disabled`: el botón sigue enfocable y su tooltip explica el motivo.
  const title = disabled && disabledReason ? `${label} — ${disabledReason}` : shortcut ? `${label} (${shortcut})` : label;
  return (
    <button
      type={type}
      data-slot="ribbon-button"
      title={title}
      aria-label={size === 'small' ? label : undefined}
      aria-keyshortcuts={shortcut}
      aria-disabled={disabled || undefined}
      aria-pressed={active}
      className={cn(buttonBase, buttonSize[size], className)}
      onClick={(e) => {
        if (disabled) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
        closeFloating();
      }}
      {...props}
    >
      {icon}
      {size !== 'small' ? <span className={size === 'large' ? 'text-center leading-tight' : undefined}>{label}</span> : null}
    </button>
  );
}

export interface RibbonMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  onSelect: () => void;
}

export interface RibbonSplitButtonProps extends Omit<RibbonButtonProps, 'size'> {
  size?: 'large' | 'medium';
  items: readonly RibbonMenuItem[];
  /** Nombre accesible de la flecha («Más opciones de Pegar»). Por defecto, «Más opciones de <label>». */
  menuLabel?: string;
}

/** Botón con acción principal y una flecha que despliega alternativas (Pegar ▾, Alinear ▾). */
function RibbonSplitButton({ items, menuLabel, size = 'medium', className, ...button }: RibbonSplitButtonProps) {
  const [open, setOpen] = React.useState(false);
  const { closeFloating } = React.useContext(RibbonContext);
  return (
    <div className={cn('inline-flex', size === 'large' ? 'flex-col items-stretch' : 'items-center')} data-slot="ribbon-split-button">
      <RibbonButton size={size} className={className} {...button} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={menuLabel ?? `Más opciones de ${button.label}`}
            aria-haspopup="menu"
            aria-expanded={open}
            className={cn(buttonBase, size === 'large' ? 'h-4 w-full' : 'h-7 w-4 px-0')}
          >
            <ChevronDown className="size-3!" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" role="menu" className="w-52 p-1">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              aria-disabled={item.disabled || undefined}
              className={cn(buttonBase, 'h-8 w-full justify-start px-2')}
              onClick={() => {
                if (item.disabled) return;
                item.onSelect();
                setOpen(false);
                closeFloating();
              }}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {item.shortcut ? <span className="text-[10px] text-muted-foreground">{item.shortcut}</span> : null}
            </button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ─── Grupo ────────────────────────────────────────────────────────────────────

export interface RibbonGroupProps {
  /** Etiqueta del grupo («Portapapeles»): va debajo del grupo o, en modo compacto, en su botón. */
  label: string;
  children: React.ReactNode;
  className?: string;
}

function RibbonGroup({ label, children, className }: RibbonGroupProps) {
  const { compact, closeFloating } = React.useContext(RibbonContext);
  const [open, setOpen] = React.useState(false);

  if (compact) {
    const inner: RibbonContextValue = {
      compact: false,
      closeFloating: () => {
        setOpen(false);
        closeFloating();
      },
    };
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            data-slot="ribbon-group-menu"
            aria-haspopup="dialog"
            aria-expanded={open}
            className={cn(buttonBase, 'h-8 px-2.5 font-medium')}
          >
            {label}
            <ChevronDown className="size-3!" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto max-w-[90vw] p-2">
          <RibbonContext.Provider value={inner}>
            <div role="group" aria-label={label} className={cn('flex flex-wrap items-center gap-1', className)}>
              {children}
            </div>
          </RibbonContext.Provider>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div
      role="group"
      aria-label={label}
      data-slot="ribbon-group"
      className={cn('flex flex-col items-stretch border-r px-2 py-1 last:border-r-0', className)}
    >
      <div className="flex flex-1 flex-wrap items-center justify-center gap-0.5">{children}</div>
      <div className="mt-0.5 text-center text-[10px] leading-none text-muted-foreground" aria-hidden="true">
        {label}
      </div>
    </div>
  );
}

// ─── Barra de acceso rápido ───────────────────────────────────────────────────

export interface QuickAccessBarProps {
  label?: string;
  children: React.ReactNode;
  className?: string;
}

/** Barra de herramientas fija encima de la cinta (deshacer, rehacer…). Flechas, Inicio y Fin mueven el foco. */
function QuickAccessBar({ label = 'Acceso rápido', children, className }: QuickAccessBarProps) {
  return (
    <div
      role="toolbar"
      aria-label={label}
      data-slot="ribbon-quick-access"
      className={cn('flex items-center gap-0.5', className)}
      onKeyDown={(e) => {
        moveFocusWithArrows(e);
      }}
    >
      {children}
    </div>
  );
}

// ─── Cinta ────────────────────────────────────────────────────────────────────

export interface RibbonTabDef {
  id: string;
  label: string;
  /**
   * Pestaña contextual («Formato de forma»): aparece según la selección y se resalta. No le roba la
   * pestaña activa al usuario al aparecer; si desaparece estando activa, vuelve a la última normal.
   */
  contextual?: boolean;
  /** Contenido: `RibbonGroup`s. Solo se monta mientras la pestaña está visible. */
  content: React.ReactNode;
}

export interface RibbonProps {
  /** Nombre accesible de la lista de pestañas. */
  label?: string;
  tabs: readonly RibbonTabDef[];
  activeTab?: string;
  defaultActiveTab?: string;
  onActiveTabChange?: (id: string) => void;
  /** Cinta colapsada: solo las pestañas; el contenido se abre flotando al elegir una. */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** `true`/`false` fuerzan el modo; `'auto'` (por defecto) lo decide por el ancho. */
  compact?: boolean | 'auto';
  /** Ancho (px) por debajo del cual `compact="auto"` reduce los grupos a desplegables. */
  compactBelow?: number;
  /** Barra de acceso rápido (`QuickAccessBar`), fija encima de las pestañas. */
  quickAccess?: React.ReactNode;
  /** Contenido a la derecha de las pestañas (p. ej. el botón «Listo»). */
  trailing?: React.ReactNode;
  /** F6 / Mayús+F6 más allá de la barra y la cinta: el anfitrión lleva el foco al lienzo. */
  onNavigateOut?: (direction: 1 | -1) => void;
  className?: string;
}

function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (v: T) => void): [T, (v: T) => void] {
  const [inner, setInner] = React.useState(defaultValue);
  const current = value ?? inner;
  const set = React.useCallback(
    (v: T) => {
      setInner(v);
      onChange?.(v);
    },
    [onChange],
  );
  return [current, set];
}

/**
 * Cinta por pestañas (estilo Word/PowerPoint/Storyline) de los editores. Genérica: el editor declara
 * sus `tabs` y su contenido; acá viven la navegación por teclado, el colapso y el modo compacto.
 */
function Ribbon({
  label = 'Cinta de opciones',
  tabs,
  activeTab,
  defaultActiveTab,
  onActiveTabChange,
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  compact = 'auto',
  compactBelow = 900,
  quickAccess,
  trailing,
  onNavigateOut,
  className,
}: RibbonProps) {
  const baseId = React.useId();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const tabRefs = React.useRef(new Map<string, HTMLButtonElement>());
  const panelRef = React.useRef<HTMLDivElement>(null);

  const [active, setActive] = useControllable(activeTab, defaultActiveTab ?? tabs.find((t) => !t.contextual)?.id ?? tabs[0]?.id ?? '', onActiveTabChange);
  const [isCollapsed, setCollapsed] = useControllable(collapsed, defaultCollapsed, onCollapsedChange);
  const [floating, setFloating] = React.useState(false);
  const [lastRegular, setLastRegular] = React.useState(() => tabs.find((t) => !t.contextual)?.id ?? '');
  const [narrow, setNarrow] = React.useState(false);

  // Pestaña efectiva: si la activa dejó de existir (contextual que se fue), la última normal.
  const ids = tabs.map((t) => t.id);
  const effective = ids.includes(active) ? active : ids.includes(lastRegular) ? lastRegular : (ids[0] ?? '');
  React.useEffect(() => {
    if (effective !== active) setActive(effective);
  }, [effective, active, setActive]);

  // Ancho: ResizeObserver puede no existir (jsdom, SSR); entonces no hay modo compacto automático.
  React.useEffect(() => {
    const el = rootRef.current;
    if (compact !== 'auto' || !el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setNarrow(entry.contentRect.width < compactBelow);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [compact, compactBelow]);
  const isCompact = compact === 'auto' ? narrow : compact;

  // El panel flotante se cierra al pulsar fuera o al expandir la cinta.
  React.useEffect(() => {
    if (!floating) return;
    const alFuera = (e: PointerEvent): void => {
      if (!rootRef.current?.contains(e.target as Node)) setFloating(false);
    };
    document.addEventListener('pointerdown', alFuera);
    return () => document.removeEventListener('pointerdown', alFuera);
  }, [floating]);
  React.useEffect(() => {
    if (!isCollapsed) setFloating(false);
  }, [isCollapsed]);

  const select = (id: string): void => {
    if (!tabs.find((t) => t.id === id)) return;
    setActive(id);
    if (!tabs.find((t) => t.id === id)?.contextual) setLastRegular(id);
  };

  const alClicPestana = (id: string): void => {
    if (!isCollapsed) {
      select(id);
      return;
    }
    // Colapsada: elegir otra pestaña abre su panel flotante; volver a pulsar la misma lo cierra.
    setFloating(id === effective ? (f) => !f : true);
    select(id);
  };

  const alDobleClic = (): void => {
    setFloating(false);
    setCollapsed(!isCollapsed);
  };

  const alTeclearPestanas = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    const at = ids.indexOf(effective);
    let next: number | null = null;
    if (e.key === 'ArrowRight') next = (at + 1) % ids.length;
    else if (e.key === 'ArrowLeft') next = (at - 1 + ids.length) % ids.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = ids.length - 1;
    if (next !== null) {
      e.preventDefault();
      const id = ids[next];
      if (id === undefined) return;
      select(id);
      tabRefs.current.get(id)?.focus();
    } else if (e.key === 'ArrowDown' && (!isCollapsed || floating)) {
      e.preventDefault();
      focusables(panelRef.current)[0]?.focus();
    }
  };

  const alTeclear = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Escape' && floating) {
      e.stopPropagation();
      setFloating(false);
      tabRefs.current.get(effective)?.focus();
      return;
    }
    if (e.key !== 'F6') return;
    e.preventDefault();
    const dir = e.shiftKey ? -1 : 1;
    const quick = rootRef.current?.querySelector<HTMLElement>('[data-ribbon-zone="quick"]') ?? null;
    // Zonas en orden: barra de acceso rápido (si hay) y pestañas/cinta.
    const zonas: Array<() => HTMLElement | undefined> = [];
    if (quick) zonas.push(() => focusables(quick)[0]);
    zonas.push(() => tabRefs.current.get(effective));
    const foco = document.activeElement;
    const actual = quick?.contains(foco) ? 0 : zonas.length - 1;
    const siguiente = actual + dir;
    if (siguiente < 0 || siguiente >= zonas.length) {
      if (onNavigateOut) onNavigateOut(dir);
      else zonas[(siguiente + zonas.length) % zonas.length]?.()?.focus();
      return;
    }
    zonas[siguiente]?.()?.focus();
  };

  const tab = tabs.find((t) => t.id === effective);
  const panelVisible = !!tab && (!isCollapsed || floating);
  const ctx = React.useMemo<RibbonContextValue>(
    () => ({ compact: isCompact, closeFloating: () => setFloating(false) }),
    [isCompact],
  );

  return (
    <RibbonContext.Provider value={ctx}>
      <div
        ref={rootRef}
        data-slot="ribbon"
        data-compact={isCompact || undefined}
        data-collapsed={isCollapsed || undefined}
        className={cn('relative flex flex-col border-b bg-card text-foreground', className)}
        onKeyDown={alTeclear}
      >
        {quickAccess ? (
          <div data-ribbon-zone="quick" className="flex items-center border-b px-2 py-0.5">
            {quickAccess}
          </div>
        ) : null}

        <div className="flex items-end gap-1 px-2 pt-1">
          <div role="tablist" aria-label={label} className="flex items-end gap-0.5" onKeyDown={alTeclearPestanas}>
            {tabs.map((t) => {
              const selected = t.id === effective;
              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    if (el) tabRefs.current.set(t.id, el);
                    else tabRefs.current.delete(t.id);
                  }}
                  type="button"
                  role="tab"
                  id={`${baseId}-tab-${t.id}`}
                  aria-selected={selected}
                  aria-controls={`${baseId}-panel`}
                  tabIndex={selected ? 0 : -1}
                  data-contextual={t.contextual || undefined}
                  className={cn(
                    'cursor-pointer rounded-t-md border border-b-0 border-transparent px-3 py-1.5 text-xs outline-hidden transition-colors hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring',
                    selected && 'border-border bg-card font-medium',
                    t.contextual && 'border-t-2 border-t-primary text-primary',
                  )}
                  onClick={() => alClicPestana(t.id)}
                  onDoubleClick={alDobleClic}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className="ml-auto flex items-center gap-1 pb-1">
            {trailing}
            <button
              type="button"
              aria-label={isCollapsed ? 'Expandir la cinta' : 'Contraer la cinta'}
              aria-expanded={!isCollapsed}
              title={isCollapsed ? 'Expandir la cinta' : 'Contraer la cinta'}
              className={cn(buttonBase, 'size-6')}
              onClick={alDobleClic}
            >
              {isCollapsed ? <ChevronDown aria-hidden="true" /> : <ChevronUp aria-hidden="true" />}
            </button>
          </div>
        </div>

        {panelVisible && tab ? (
          <div
            ref={panelRef}
            role="tabpanel"
            id={`${baseId}-panel`}
            aria-labelledby={`${baseId}-tab-${tab.id}`}
            data-floating={isCollapsed || undefined}
            className={cn(
              'flex min-h-[5.5rem] flex-wrap items-stretch gap-0 border-t bg-card px-1 py-1',
              isCollapsed && 'absolute inset-x-0 top-full z-20 border-b shadow-md',
            )}
            onKeyDown={(e) => {
              moveFocusWithArrows(e);
            }}
          >
            {tab.content}
          </div>
        ) : null}
      </div>
    </RibbonContext.Provider>
  );
}

export { Ribbon, RibbonGroup, RibbonButton, RibbonSplitButton, QuickAccessBar };
