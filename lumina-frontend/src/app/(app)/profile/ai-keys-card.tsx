'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { KeyRound, Loader2, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiErrorMessage } from '@/lib/api-error-message';
import {
  AiPreferredProviderSelect,
  describeAiResolvedStatus,
} from '@/components/ai/ai-preferred-select';
import {
  useAiSettings,
  useDeleteAiKey,
  useSaveAiKey,
  useSetPreferredAiProvider,
  useTestAiKey,
  type AiProviderStatus,
} from '@/hooks/api/use-ai-settings';

function ProviderRow({
  provider,
  encryptionReady,
  save,
  remove,
  test,
}: {
  provider: AiProviderStatus;
  encryptionReady: boolean;
  save: ReturnType<typeof useSaveAiKey>;
  remove: ReturnType<typeof useDeleteAiKey>;
  test: ReturnType<typeof useTestAiKey>;
}) {
  const [draft, setDraft] = useState('');
  const busy = save.isPending || remove.isPending || test.isPending;
  const draftKey = draft.trim();

  return (
    <div className="rounded-lg border border-[#e5e7eb] p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#111827]">{provider.label}</p>
          <p className="mt-0.5 text-xs text-[#6b7280]">
            {provider.configured
              ? `Guardada ${provider.keyHint}${
                  provider.lastVerifiedAt
                    ? ` · verificada ${new Date(provider.lastVerifiedAt).toLocaleString('es-CO')}`
                    : ''
                }`
              : 'Sin clave propia'}
          </p>
        </div>
        {provider.configured && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-destructive"
            disabled={busy}
            onClick={() =>
              remove.mutate(provider.provider, {
                onSuccess: () => toast.success(`Clave de ${provider.label} eliminada.`),
                onError: (err) =>
                  toast.error(apiErrorMessage(err, 'No se pudo eliminar la clave.')),
              })
            }
          >
            Quitar
          </Button>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`ai-key-${provider.provider}`} className="text-xs text-[#6b7280]">
          {provider.configured ? 'Reemplazar clave' : 'API key'}
        </Label>
        <Input
          id={`ai-key-${provider.provider}`}
          type="password"
          autoComplete="new-password"
          autoCorrect="off"
          spellCheck={false}
          data-1p-ignore="true"
          data-lpignore="true"
          placeholder={provider.configured ? 'Nueva clave…' : 'Pega tu API key'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="h-8 text-sm"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          className="h-8 bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
          disabled={busy || draftKey.length < 8 || !encryptionReady}
          onClick={() => {
            save.mutate(
              { provider: provider.provider, apiKey: draftKey },
              {
                onSuccess: () => {
                  setDraft('');
                  toast.success(`Clave de ${provider.label} guardada.`);
                },
                onError: (err) =>
                  toast.error(apiErrorMessage(err, 'No se pudo guardar la clave.')),
              },
            );
          }}
        >
          {save.isPending ? <Loader2 className="size-3.5 animate-spin" /> : 'Guardar'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8"
          disabled={busy || (draftKey.length < 8 && !provider.configured)}
          onClick={() => {
            const apiKey = draftKey.length >= 8 ? draftKey : undefined;
            test.mutate(
              { provider: provider.provider, apiKey },
              {
                onSuccess: () =>
                  toast.success(`Conexión con ${provider.label} correcta.`),
                onError: (err) =>
                  toast.error(
                    apiErrorMessage(err, `No se pudo conectar con ${provider.label}.`),
                  ),
              },
            );
          }}
        >
          {test.isPending ? <Loader2 className="size-3.5 animate-spin" /> : 'Probar conexión'}
        </Button>
      </div>
    </div>
  );
}

export function AiKeysCard() {
  const { data, isLoading, isError } = useAiSettings();
  const setPreferred = useSetPreferredAiProvider();
  const save = useSaveAiKey();
  const remove = useDeleteAiKey();
  const test = useTestAiKey();

  return (
    <div
      id="ai-keys"
      className="bg-white border border-[#e5e7eb] rounded-[10px] p-6"
      style={{ boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.06)' }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f9fafb]">
          <Sparkles className="h-5 w-5 text-[#2563EB]" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-[#111827]">Claves de IA (BYOK)</h3>
          <p className="mt-0.5 text-xs text-[#6b7280]">
            Usa tu propia clave de Gemini, OpenAI o Claude. Si no configuras ninguna, Lumina
            usa Gemini de la plataforma cuando esté disponible. Las claves se cifran en el
            servidor y nunca se vuelven a mostrar.
          </p>
        </div>
      </div>

      {isLoading && (
        <p className="text-xs text-[#6b7280] flex items-center gap-2">
          <Loader2 className="size-3.5 animate-spin" /> Cargando configuración…
        </p>
      )}
      {isError && (
        <p className="text-xs text-destructive">
          No se pudo cargar la configuración de IA. ¿Tienes sesión de docente?
        </p>
      )}

      {data && (
        <div className="space-y-4">
          {!data.encryptionReady && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
              El servidor no tiene un secreto de cifrado válido. Puedes usar el fallback
              de plataforma, pero no se pueden guardar claves propias.
            </p>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs text-[#6b7280]">Proveedor preferido</Label>
            <AiPreferredProviderSelect
              settings={data}
              disabled={setPreferred.isPending}
              onChange={(provider) =>
                setPreferred.mutate(provider, {
                  onSuccess: () => toast.success('Proveedor preferido actualizado.'),
                  onError: (err) =>
                    toast.error(apiErrorMessage(err, 'No se pudo cambiar el proveedor.')),
                })
              }
            />
            <p className="text-[11px] text-[#6b7280] flex items-center gap-1">
              <KeyRound className="size-3" />
              {data.resolvedProvider
                ? `Activo: ${describeAiResolvedStatus(data)}`
                : 'Ningún proveedor disponible. Configura una clave o GEMINI_API_KEY.'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {data.providers.map((p) => (
              <ProviderRow
                key={p.provider}
                provider={p}
                encryptionReady={data.encryptionReady}
                save={save}
                remove={remove}
                test={test}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
