// ─── Regresión: panel de propiedades de Diagrama — "desorden" / elementos
// duplicados ───
// Dos problemas reales reportados en producción:
// 1. "Pirámide"/"Embudo"/"Cebolla" aparecían DOS veces en el panel: una vez
//    como botón base en "Tipo de Diagrama" y otra vez como "plantilla
//    pedagógica" ("Pirámide de Bloom"/"Embudo de Proceso"/"Círculos
//    Concéntricos") — pero `handleLoadTemplate` para esos 3 ids llamaba
//    exactamente al mismo `createDefault*Block` que el botón base: cero
//    diferencia real, solo el mismo elemento repetido con otro nombre.
// 2. El panel entero (Tipo de Diagrama + Paleta + Estilo Visual + las 11
//    plantillas) estaba siempre expandido de punta a punta — "un desorden".
//    "Plantillas Pedagógicas" (la sección más larga, de uso ocasional) pasa
//    a ser colapsable, cerrada por defecto.
// 3. "Tipo de Diagrama" (el selector primario) y "Paleta de Colores"
//    (+ Estilo Visual Global) también pasan a colapsables — Tipo abierta por
//    defecto (refleja el estado actual del bloque), Paleta cerrada (uso
//    ocasional, como Plantillas).

import { render, cleanup, screen, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DiagramaProperties } from './diagrama-properties.js';
import type { DiagramaBlock, DiagramaGrafoBlock } from '@lumina/types/slide';
import { createDefaultFlujoBlock, createDefaultMapaMentalBlock } from './diagrama-defaults.js';

afterEach(() => {
  cleanup();
});

function renderProperties() {
  const block = createDefaultMapaMentalBlock();
  const applyNow = vi.fn(async () => undefined);
  render(<DiagramaProperties block={block} applyNow={applyNow} />);
}

describe('DiagramaProperties — sin plantillas duplicadas y panel colapsable (regresión)', () => {
  it('"Pirámide"/"Embudo"/"Cebolla" aparecen una sola vez cada uno (solo como Tipo de Diagrama, no también como plantilla)', () => {
    renderProperties();
    // Los botones base de "Tipo de Diagrama" siempre están montados.
    expect(screen.getByText('Pirámide')).toBeTruthy();
    expect(screen.getByText('Embudo')).toBeTruthy();
    expect(screen.getByText('Cebolla')).toBeTruthy();
    // Las versiones "plantilla" (mismo contenido, otro nombre) ya no existen.
    expect(screen.queryByText('Pirámide de Bloom')).toBeNull();
    expect(screen.queryByText('Embudo de Proceso')).toBeNull();
    expect(screen.queryByText('Círculos Concéntricos')).toBeNull();
  });

  it('"Plantillas Pedagógicas" arranca colapsada y se expande al hacer clic', () => {
    renderProperties();
    // Colapsada: el trigger existe, pero el contenido (ej. "Modelo Frayer") no está montado.
    screen.getByText('Plantillas Pedagógicas');
    expect(screen.queryByText('Modelo Frayer')).toBeNull();

    fireEvent.click(screen.getByText('Plantillas Pedagógicas'));
    screen.getByText('Modelo Frayer');
    screen.getByText('Ishikawa');
  });

  it('"Tipo de Diagrama" arranca expandida (selector primario) y se puede colapsar', () => {
    renderProperties();
    // Abierta por defecto: los botones de tipo ya están montados (el badge
    // del trigger también dice "Mapa Mental" — "Organigrama" es unívoco).
    screen.getByText('Organigrama');

    fireEvent.click(screen.getByText('Tipo de Diagrama'));
    expect(screen.queryByText('Organigrama')).toBeNull();
  });

  it('"Paleta de Colores" arranca colapsada (uso ocasional, como Plantillas) y se expande al hacer clic', () => {
    renderProperties();
    expect(screen.queryByText('Editorial Académico')).toBeNull();

    fireEvent.click(screen.getByText('Paleta de Colores'));
    screen.getByText('Editorial Académico');
    // Estilo Visual Global vive dentro del mismo bloque colapsable.
    screen.getByText('Estilo Visual Global');
  });

  describe('cambio de subtipo y `dirigida` por arista (V1.4)', () => {
    // Las secciones recuerdan abierto/cerrado en localStorage: un test previo
    // colapsa «Tipo de Diagrama» y ocultaría los botones de tipo.
    beforeEach(() => {
      window.localStorage.clear();
    });

    /** Aplica la última actualización enviada a `applyNow` sobre `base` y devuelve el bloque resultante. */
    function ultimoBloque(applyNow: ReturnType<typeof vi.fn>, base: DiagramaBlock): DiagramaGrafoBlock {
      const fn = applyNow.mock.calls.at(-1)?.[0] as (b: DiagramaBlock) => DiagramaBlock;
      return fn(base) as DiagramaGrafoBlock;
    }

    function clicTipo(label: string) {
      // El badge del encabezado repite el nombre del tipo actual: se busca el <button>.
      const boton = screen.getAllByText(label).map((n) => n.closest('button')).find(Boolean);
      fireEvent.click(boton as HTMLElement);
    }

    it('flujo → mapa mental → flujo conserva la `dirigida` explícita de cada arista', () => {
      const base = createDefaultFlujoBlock({ id: 'b-dir' }) as DiagramaGrafoBlock;
      const conDecisiones: DiagramaGrafoBlock = {
        ...base,
        aristas: base.aristas.map((a, i) => ({ ...a, dirigida: i === 0 })),
      };
      expect(conDecisiones.aristas.length).toBeGreaterThan(1);
      const applyNow = vi.fn(async () => undefined);
      render(<DiagramaProperties block={conDecisiones} applyNow={applyNow} />);

      clicTipo('Mapa Mental');
      const enMapa = ultimoBloque(applyNow, conDecisiones);
      expect(enMapa.subtipo).toBe('mapa_mental');
      expect(enMapa.aristas.map((a) => a.dirigida)).toEqual(conDecisiones.aristas.map((a) => a.dirigida));

      clicTipo('Flujo');
      const deVuelta = ultimoBloque(applyNow, enMapa);
      expect(deVuelta.subtipo).toBe('flujo');
      expect(deVuelta.aristas.map((a) => a.dirigida)).toEqual(conDecisiones.aristas.map((a) => a.dirigida));
    });

    it('las aristas sin `dirigida` explícita toman el valor por defecto del subtipo destino', () => {
      const base = createDefaultMapaMentalBlock({ id: 'b-sin' }) as DiagramaGrafoBlock;
      const sinDecision: DiagramaGrafoBlock = {
        ...base,
        aristas: base.aristas.map(({ dirigida: _d, ...resto }) => resto),
      };
      const applyNow = vi.fn(async () => undefined);
      render(<DiagramaProperties block={sinDecision} applyNow={applyNow} />);

      clicTipo('Flujo');
      const enFlujo = ultimoBloque(applyNow, sinDecision);
      expect(enFlujo.aristas.every((a) => a.dirigida === true)).toBe(true);
    });
  });
});
