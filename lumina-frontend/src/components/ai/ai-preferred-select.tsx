'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AiProviderId, AiSettings } from '@/hooks/api/use-ai-settings';

export function describeAiResolvedStatus(settings: AiSettings): string {
  const label = settings.providers.find(
    (p) => p.provider === settings.resolvedProvider,
  )?.label;
  if (!settings.resolvedProvider || !label) return 'Sin proveedor disponible';
  return settings.resolvedSource === 'byok'
    ? `${label} (tu clave)`
    : `${label} (plataforma)`;
}

export function AiPreferredProviderSelect({
  settings,
  disabled,
  onChange,
  size = 'md',
}: {
  settings: AiSettings;
  disabled?: boolean;
  onChange: (provider: AiProviderId) => void;
  size?: 'sm' | 'md';
}) {
  return (
    <Select
      value={settings.preferredProvider ?? 'GEMINI'}
      onValueChange={(v) => onChange(v as AiProviderId)}
      disabled={disabled}
    >
      <SelectTrigger
        className={size === 'sm' ? 'h-7 text-[11px]' : 'h-8 text-sm'}
        size={size === 'sm' ? 'sm' : undefined}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {settings.providers.map((p) => (
          <SelectItem
            key={p.provider}
            value={p.provider}
            className={size === 'sm' ? 'text-xs' : 'text-sm'}
          >
            {p.label}
            {p.configured ? (size === 'sm' ? ' · propia' : ' · clave propia') : ''}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
