// C1/C4 (AGENTS.md, Etapa K): el motor decide el FLUJO; la NOTA la decide
// @lumina/scoring. Estas pruebas fijan esa frontera para que no se erosione.
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { Accion, AccionTipo } from '@lumina/types/interaction';
import { crearEstadoInicial } from './estado.js';
import { procesarEvento } from './motor.js';
import { bool, deBloque, num, regla, txt } from './prueba-utils.js';

const aqui = dirname(fileURLToPath(import.meta.url));
const paquete = JSON.parse(
  readFileSync(join(aqui, '..', 'package.json'), 'utf8'),
) as Record<string, Record<string, string> | undefined>;

describe('C1/C4: el motor no puede calificar', () => {
  it('el paquete no depende de @lumina/scoring', () => {
    for (const seccion of ['dependencies', 'devDependencies', 'peerDependencies']) {
      expect(Object.keys(paquete[seccion] ?? {})).not.toContain('@lumina/scoring');
    }
  });

  it('ningún archivo fuente importa @lumina/scoring', () => {
    const fuentes = readdirSync(aqui).filter(
      (f) => f.endsWith('.ts') && !f.endsWith('.spec.ts'),
    );
    expect(fuentes.length).toBeGreaterThan(3);
    for (const f of fuentes) {
      const src = readFileSync(join(aqui, f), 'utf8');
      // Los comentarios pueden NOMBRAR el paquete; lo que no puede haber es un import.
      // Cubre `import x from`, `import 'x'`, `import('x')`, `export … from` y `require('x')`.
      expect(src, f).not.toMatch(/(?:from|import|require)\s*\(?\s*['"]@lumina\/scoring/);
    }
  });

  // Una acción de cada tipo, ejecutada de verdad.
  const una: Record<AccionTipo, Accion> = {
    ir_a_slide: { tipo: 'ir_a_slide', slideId: 's2' },
    siguiente: { tipo: 'siguiente' },
    anterior: { tipo: 'anterior' },
    mostrar: { tipo: 'mostrar', bloqueId: 'a' },
    ocultar: { tipo: 'ocultar', bloqueId: 'a' },
    cambiar_estado: { tipo: 'cambiar_estado', bloqueId: 'a', estado: 'visitado' },
    abrir_capa: { tipo: 'abrir_capa', capaId: 'c' },
    cerrar_capa: { tipo: 'cerrar_capa', capaId: 'c' },
    asignar_variable: { tipo: 'asignar_variable', variableId: 'n', valor: { tipo: 'literal', valor: 9 } },
    sumar_variable: { tipo: 'sumar_variable', variableId: 'n', cantidad: 5 },
    restar_variable: { tipo: 'restar_variable', variableId: 'n', cantidad: { tipo: 'literal', valor: 1 } },
    multiplicar_variable: { tipo: 'multiplicar_variable', variableId: 'n', cantidad: { tipo: 'literal', valor: 2 } },
    dividir_variable: { tipo: 'dividir_variable', variableId: 'n', cantidad: { tipo: 'literal', valor: 2 } },
    limpiar_variable: { tipo: 'limpiar_variable', variableId: 'n' },
    concatenar_variable: { tipo: 'concatenar_variable', variableId: 't', texto: { tipo: 'literal', valor: 'x' } },
    alternar_variable: { tipo: 'alternar_variable', variableId: 'b' },
  };

  it.each(Object.entries(una))(
    'la acción «%s» solo produce efectos de navegación y toca solo el estado de flujo',
    (_nombre, accion) => {
      const variables = [num('n'), txt('t'), bool('b')];
      const base = crearEstadoInicial(variables);
      const r = procesarEvento(
        [deBloque(regla('r', 'clic', [accion]), 'a')],
        base,
        { tipo: 'clic', bloqueId: 'a', slideId: 's1' },
        { variables },
      );
      // Único tipo de efecto posible: navegar.
      expect(r.efectos.every((e) => e.tipo === 'navegar')).toBe(true);
      // El estado solo tiene las 5 claves de flujo: ninguna de nota o puntaje.
      expect(Object.keys(r.estado).sort()).toEqual(
        ['capasAbiertas', 'estados', 'respuestas', 'variables', 'visibles'],
      );
      // El resultado completo no menciona puntaje/nota/score en ninguna clave.
      expect(JSON.stringify(r)).not.toMatch(/"(score|puntaje|puntos|nota|calificacion)"/i);
    },
  );

  it('cubre todas las acciones del catálogo', () => {
    expect(Object.keys(una)).toHaveLength(16);
  });
});
