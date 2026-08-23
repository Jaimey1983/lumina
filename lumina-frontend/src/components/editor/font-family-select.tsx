'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { allGoogleFontFamilies, FONT_CATALOG, fontsGroupedByCategory, resolveFontFamily } from '@/lib/font-catalog';
import { ensureGoogleFonts } from '@/components/editor/google-fonts-loader';
import { readRecentFonts, rememberRecentFont } from '@/lib/font-recent';
import { cn } from '@/lib/utils';

interface FontFamilySelectProps {
  value?: string;
  onValueChange: (familia: string) => void;
  disabled?: boolean;
  label?: string;
  labelClassName?: string;
  id?: string;
}

/** Único selector de fuente del editor. Usar solo en el panel derecho de propiedades. */
export function FontFamilySelect({
  value,
  onValueChange,
  disabled,
  label = 'Fuente',
  labelClassName,
  id,
}: FontFamilySelectProps) {
  const resolved = resolveFontFamily(value);
  const groups = fontsGroupedByCategory();
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setRecent(readRecentFonts());
  }, []);

  useEffect(() => {
    if (open) ensureGoogleFonts(allGoogleFontFamilies());
  }, [open]);

  const recentEntries = useMemo(
    () =>
      recent
        .map((familia) => FONT_CATALOG.find((f) => f.familia === familia))
        .filter((entry): entry is NonNullable<typeof entry> => !!entry),
    [recent],
  );

  const selectFont = (familia: string) => {
    onValueChange(familia);
    setRecent(rememberRecentFont(familia));
    setOpen(false);
  };

  return (
    <div className="space-y-1.5">
      {label ? (
        <Label htmlFor={id} className={cn('text-xs', labelClassName)}>
          {label}
        </Label>
      ) : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="h-8 w-full justify-between px-2.5 text-xs font-normal"
            aria-label="Elegir fuente"
          >
            <span className="truncate" style={{ fontFamily: resolved }}>
              {resolved}
            </span>
            <ChevronDown className="size-3.5 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder="Buscar fuente…" className="h-9 text-xs" />
            <CommandList className="max-h-64">
              <CommandEmpty className="py-4 text-xs">No hay fuentes con ese nombre.</CommandEmpty>
              {recentEntries.length > 0 ? (
                <CommandGroup heading="Recientes">
                  {recentEntries.map((f) => (
                    <CommandItem
                      key={`recent-${f.familia}`}
                      value={`${f.nombre} ${f.familia} reciente`}
                      className="text-xs"
                      onSelect={() => selectFont(f.familia)}
                    >
                      <span className="truncate" style={{ fontFamily: f.familia }}>
                        {f.nombre}
                      </span>
                      {resolved === f.familia ? <Check className="ms-auto size-3.5 text-primary" /> : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
              {groups.map((group) => (
                <CommandGroup key={group.categoria} heading={group.label}>
                  {group.fonts.map((f) => (
                    <CommandItem
                      key={f.familia}
                      value={`${f.nombre} ${f.familia} ${group.label}`}
                      className="text-xs"
                      onSelect={() => selectFont(f.familia)}
                    >
                      <span className="truncate" style={{ fontFamily: f.familia }}>
                        {f.nombre}
                      </span>
                      {resolved === f.familia ? <Check className="ms-auto size-3.5 text-primary" /> : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
