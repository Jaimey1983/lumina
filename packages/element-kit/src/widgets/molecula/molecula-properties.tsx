'use client';

import type { Block } from '@lumina/types/slide';
import type { MoleculaWidget } from '@lumina/types/widget';
import { Button } from '@lumina/ui/button';
import { Label } from '@lumina/ui/label';
import { WidgetDraftTextField } from '@lumina/editor-shared/panel-only-field';
import { WidgetSectionTitle } from '@lumina/editor-shared/widget-properties-panel';
import { useState } from 'react';

import { normalizeMoleculaWidget } from './molecula-config.js';

export type ResolvePubChemName = (name: string) => Promise<{
  name: string;
  smiles: string;
  molecularFormula: string | null;
}>;

export function MoleculaProperties({
  block,
  applyNow,
  resolvePubChemName,
}: {
  block: MoleculaWidget;
  applyNow: (fn: (b: Block) => Block) => void | Promise<void>;
  resolvePubChemName?: ResolvePubChemName;
}) {
  const widget = normalizeMoleculaWidget(block);
  const [searchName, setSearchName] = useState(widget.nombreComun ?? '');
  const [busy, setBusy] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const update = (fn: (w: MoleculaWidget) => MoleculaWidget) => {
    void applyNow((b) =>
      b.tipo === 'molecula' ? fn(normalizeMoleculaWidget(b)) : b,
    );
  };

  const buscarPubChem = async () => {
    const q = searchName.trim();
    if (!q || !resolvePubChemName) return;
    setBusy(true);
    setSearchError(null);
    try {
      const hit = await resolvePubChemName(q);
      update((w) => ({
        ...w,
        smiles: hit.smiles,
        nombreComun: hit.name,
        formulaMolecular: hit.molecularFormula ?? w.formulaMolecular,
      }));
    } catch (e) {
      setSearchError(
        e instanceof Error ? e.message : 'No se pudo resolver el nombre',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <WidgetSectionTitle>Estructura</WidgetSectionTitle>
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label className="text-xs">SMILES</Label>
            <WidgetDraftTextField
              value={widget.smiles}
              onChange={(smiles) => update((w) => ({ ...w, smiles }))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Fórmula molecular (accesibilidad)</Label>
            <WidgetDraftTextField
              value={widget.formulaMolecular ?? ''}
              onChange={(formulaMolecular) =>
                update((w) => ({ ...w, formulaMolecular }))
              }
            />
          </div>
          {resolvePubChemName ? (
            <div className="space-y-2 rounded-md border border-border p-2">
              <Label className="text-xs">Buscar por nombre (PubChem)</Label>
              <WidgetDraftTextField
                value={searchName}
                onChange={setSearchName}
                placeholder="ej. ethanol, glucose"
              />
              {searchError ? (
                <p className="text-xs text-destructive">{searchError}</p>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={busy || !searchName.trim()}
                onClick={() => void buscarPubChem()}
              >
                {busy ? 'Buscando…' : 'Resolver SMILES'}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
      <div>
        <WidgetSectionTitle>Encabezado</WidgetSectionTitle>
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label className="text-xs">Título</Label>
            <WidgetDraftTextField
              value={widget.tituloWidget}
              onChange={(tituloWidget) => update((w) => ({ ...w, tituloWidget }))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Subtítulo</Label>
            <WidgetDraftTextField
              value={widget.subtituloWidget}
              onChange={(subtituloWidget) =>
                update((w) => ({ ...w, subtituloWidget }))
              }
              multiline
            />
          </div>
        </div>
      </div>
    </div>
  );
}
