"use client";

// Diálogo «Esquema…» (Y14): un área de texto y una vista previa en vivo (nodos, niveles, raíces), sin dibujar nada.
// Se monta solo mientras está abierto: cada vez empieza vacío, y cancelar o Escape no deja nada en el dibujo.

import { useId, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent, type ReactElement } from "react";
import { analizarEsquema, MAX_LARGO_LINEA_ESQUEMA, MAX_NODOS_ESQUEMA, type Esquema } from "../esquema-a-escena.js";
import type { ModoOrganizar } from "./organizar-auto.js";
import { useFocoAtrapado } from "./foco-atrapado.js";

export interface DialogoEsquemaProps {
  onCerrar: () => void;
  onAceptar: (esquema: Esquema, modo: ModoOrganizar) => void;
  focoLienzo: () => void;
}

const DISPOSICIONES: ReadonlyArray<{ modo: ModoOrganizar; etiqueta: string }> = [
  { modo: "arbol", etiqueta: "Árbol" },
  { modo: "radial", etiqueta: "Radial" },
  { modo: "jerarquico", etiqueta: "Jerárquico" },
];

const plural = (n: number, uno: string, varios: string): string => `${n} ${n === 1 ? uno : varios}`;

/** Lo que se lee en la vista previa (y se anuncia): cantidades y avisos. */
export function resumenDeEsquema(e: Esquema): string {
  if (e.nodos.length === 0) return "Escribe o pega un esquema: una línea por nodo y sangría para los niveles.";
  const partes = [plural(e.nodos.length, "nodo", "nodos"), plural(e.niveles, "nivel", "niveles"), plural(e.raices, "raíz", "raíces")];
  if (e.raices > 1) partes.push("varios árboles sin conectar entre sí");
  return partes.join(" · ");
}

export function avisosDeEsquema(e: Esquema): string[] {
  const avisos: string[] = [];
  if (e.sobrantes > 0) avisos.push(`Hay ${plural(e.sobrantes + e.nodos.length, "línea", "líneas")}: solo se crean las primeras ${MAX_NODOS_ESQUEMA}.`);
  if (e.recortadas > 0) avisos.push(`${plural(e.recortadas, "línea se recortó", "líneas se recortaron")} a ${MAX_LARGO_LINEA_ESQUEMA} caracteres.`);
  return avisos;
}

export function DialogoEsquema({ onCerrar, onAceptar, focoLienzo }: DialogoEsquemaProps): ReactElement {
  const dialogoRef = useRef<HTMLDivElement>(null);
  const [texto, setTexto] = useState("");
  const [modo, setModo] = useState<ModoOrganizar>("arbol");
  const id = useId();
  const esquema = useMemo(() => analizarEsquema(texto), [texto]);
  const vacio = esquema.nodos.length === 0;

  // Escape, el clic fuera y el retorno de foco los lleva el hook.
  useFocoAtrapado({ abierto: true, contenedorRef: dialogoRef, alCerrar: onCerrar, focoRespaldo: focoLienzo });

  const aceptar = (): void => {
    if (!vacio) onAceptar(esquema, modo);
  };
  // Enter escribe un salto de línea; Ctrl+Enter acepta desde cualquier control del diálogo (en captura: el hook retiene el resto).
  const alTeclear = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      aceptar();
    }
  };

  return (
    <div className="pointer-events-auto absolute inset-0 z-[110] flex items-center justify-center bg-black/40 p-4" data-esquema-fondo="">
      <div
        ref={dialogoRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-titulo`}
        onKeyDownCapture={alTeclear}
        className="flex max-h-[min(85vh,560px)] w-full max-w-xl flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-lg"
      >
        <header className="border-b px-4 py-3">
          <h2 id={`${id}-titulo`} className="text-base font-semibold">
            Esquema a diagrama
          </h2>
        </header>
        <div className="flex flex-col gap-3 overflow-y-auto px-4 py-3">
          <label className="flex flex-col gap-1 text-sm" htmlFor={`${id}-texto`}>
            Esquema
            <textarea
              id={`${id}-texto`}
              className="h-44 w-full resize-y rounded-md border bg-background p-2 font-mono text-sm"
              value={texto}
              placeholder={"Tema\n  Idea 1\n    Detalle\n  Idea 2"}
              spellCheck={false}
              aria-describedby={`${id}-vista`}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setTexto(e.target.value)}
            />
          </label>
          <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <legend className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Disposición</legend>
            {DISPOSICIONES.map((d) => (
              <label key={d.modo} className="flex items-center gap-1.5">
                <input type="radio" name={`${id}-modo`} value={d.modo} checked={modo === d.modo} onChange={() => setModo(d.modo)} />
                {d.etiqueta}
              </label>
            ))}
          </fieldset>
          <div id={`${id}-vista`} role="status" aria-live="polite" className="min-h-10 text-sm text-muted-foreground" data-esquema-vista="">
            <p>{resumenDeEsquema(esquema)}</p>
            {avisosDeEsquema(esquema).map((a) => (
              <p key={a} className="text-amber-600 dark:text-amber-400">
                {a}
              </p>
            ))}
          </div>
        </div>
        <footer className="flex justify-end gap-2 border-t px-4 py-3">
          <button type="button" className="rounded-md px-3 py-1.5 text-sm hover:bg-accent" onClick={onCerrar}>
            Cancelar
          </button>
          <button
            type="button"
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground aria-disabled:opacity-50"
            aria-disabled={vacio}
            title={vacio ? "Escribe al menos una línea" : undefined}
            onClick={aceptar}
          >
            Crear diagrama
          </button>
        </footer>
      </div>
    </div>
  );
}
