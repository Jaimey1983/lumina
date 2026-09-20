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

import { render, cleanup, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DiagramaProperties } from './diagrama-properties.js';
import { createDefaultMapaMentalBlock } from './diagrama-defaults.js';

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
});
