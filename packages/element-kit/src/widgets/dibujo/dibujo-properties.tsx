"use client";

import { useState, type ReactElement } from "react";
import { PresetGallery, aplicarPreset } from "@lumina/editor-shared/preset-gallery";
import { WidgetSectionTitle } from "@lumina/editor-shared/widget-properties-panel";
import { Button } from "@lumina/ui/button";
import { Input } from "@lumina/ui/input";
import { Label } from "@lumina/ui/label";
import { Textarea } from "@lumina/ui/textarea";
import { PenTool } from "lucide-react";
import { EditorLibreModal } from "../../elements/dibujo/editor/editor-libre-modal.js";
import { presetsDelWidget } from "../widget-presets.js";
import { DIBUJO_DESCRIPCION_MAX, DIBUJO_TITULO_MAX, normalizeDibujoWidget } from "./dibujo-defaults.js";
import type { DibujoEstado } from "./dibujo-types.js";

export interface DibujoPropertiesProps {
  estado: DibujoEstado;
  onChange: (estado: DibujoEstado) => void;
}

export function DibujoProperties({ estado: crudo, onChange }: DibujoPropertiesProps): ReactElement {
  const estado = normalizeDibujoWidget(crudo);
  const elementos = estado.escena.elementos.length;
  const [editando, setEditando] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <PresetGallery
        presets={presetsDelWidget("dibujo")}
        estado={estado}
        title="Plantillas"
        storageKey="widget.dibujo.plantillas"
        onSelect={(preset) => onChange(aplicarPreset(estado, preset))}
      />

      <div className="space-y-2">
        <WidgetSectionTitle>Dibujo</WidgetSectionTitle>
        <div className="space-y-1.5">
          <Label htmlFor="dibujo-titulo" className="text-xs">
            Título
          </Label>
          <Input
            id="dibujo-titulo"
            value={estado.titulo ?? ""}
            maxLength={DIBUJO_TITULO_MAX}
            placeholder="Ej: Ciclo del agua"
            onChange={(e) => onChange({ ...estado, titulo: e.target.value })}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dibujo-descripcion" className="text-xs">
            Descripción para lectores de pantalla
          </Label>
          <Textarea
            id="dibujo-descripcion"
            value={estado.descripcionAccesible ?? ""}
            maxLength={DIBUJO_DESCRIPCION_MAX}
            rows={3}
            placeholder="Cuenta con palabras qué muestra el dibujo."
            onChange={(e) => onChange({ ...estado, descripcionAccesible: e.target.value })}
            className="resize-none text-xs"
          />
        </div>
      </div>

      <div className="space-y-2">
        <WidgetSectionTitle>Contenido</WidgetSectionTitle>
        <p className="text-[11px] text-muted-foreground" data-dibujo-resumen="">
          {elementos === 0 ? "El lienzo está vacío." : `${elementos} ${elementos === 1 ? "elemento" : "elementos"} en el lienzo.`}
        </p>
        <Button type="button" size="sm" className="w-full" onClick={() => setEditando(true)} data-dibujo-editar="">
          <PenTool /> Editar dibujo
        </Button>
        <p className="text-[11px] text-muted-foreground">
          Abre el lienzo a pantalla casi completa: elige, mueve, redimensiona y gira formas. Las herramientas para crear formas, líneas y texto llegan en el siguiente paso de la etapa.
        </p>
      </div>

      <EditorLibreModal
        abierto={editando}
        escena={estado.escena}
        {...(estado.titulo !== undefined ? { titulo: estado.titulo } : {})}
        onCambio={(escena) => onChange(normalizeDibujoWidget({ ...estado, escena }))}
        onCerrar={() => setEditando(false)}
      />
    </div>
  );
}
