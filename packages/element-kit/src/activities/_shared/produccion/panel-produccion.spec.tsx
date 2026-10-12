import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Activity, QuizMultiple, TrueFalse } from '@lumina/types/slide';

import '../../../index.js'; // puebla el registry: la vista previa busca el Viewer por tipo
import { quizMultipleTemplate, trueFalseTemplate } from '../../_classic/activity-templates.js';
import { GeneradorActividadProvider, type GeneradorActividad } from './generacion.js';
import { PanelProduccion } from './panel-produccion.js';

beforeEach(() => {
  try {
    localStorage.clear();
  } catch {
    /* sin storage */
  }
});
afterEach(() => cleanup());

const quiz = () => structuredClone(quizMultipleTemplate()) as QuizMultiple;

function montar(a: Activity, extra?: { generador?: GeneradorActividad }) {
  const onChange = vi.fn();
  const ui = (act: Activity) => (
    <GeneradorActividadProvider generador={extra?.generador ?? null}>
      <PanelProduccion actividad={act} onChange={onChange} />
    </GeneradorActividadProvider>
  );
  const r = render(ui(a));
  return { ...r, onChange, actualizar: (act: Activity) => r.rerender(ui(act)) };
}
const abrir = (nombre: RegExp) => fireEvent.click(screen.getByRole('button', { name: nombre }));

describe('Revisión', () => {
  it('una actividad correcta: «Todo en orden» y sin lista', () => {
    montar(quiz());
    expect(screen.getAllByText('Todo en orden: se puede jugar.').length).toBeGreaterThan(0);
    expect(screen.queryByLabelText('Problemas de la actividad')).toBeNull();
  });
  it('con problemas: cuenta, lista con el campo, y los errores abren la sección', () => {
    const a = quiz();
    a.preguntas[0]!.opciones.forEach((o) => (o.esCorrecta = false));
    a.preguntas[0]!.texto = '';
    montar(a);
    const lista = screen.getByLabelText('Problemas de la actividad');
    expect(lista.textContent).toContain('Pregunta 1');
    expect(lista.textContent).toContain('No se puede jugar');
    expect(lista.textContent).toContain('Ninguna opción está marcada como correcta.');
    expect(screen.getAllByText(/2 problemas que impiden jugar\./).length).toBeGreaterThan(0);
  });
  it('un aviso no impide jugar y se dice distinto', () => {
    const a = structuredClone(trueFalseTemplate()) as TrueFalse;
    const q = quiz();
    q.preguntas[0]!.opciones = [
      { id: 'a', texto: 'Igual', esCorrecta: true },
      { id: 'b', texto: 'igual', esCorrecta: false },
    ];
    montar(q);
    expect(screen.getAllByText('1 aviso.').length).toBeGreaterThan(0);
    expect(a.tipo).toBe('verdadero_falso');
  });
  it('el resumen se anuncia en una región viva (role=status)', () => {
    montar(quiz());
    const estado = screen.getByRole('status');
    expect(estado.getAttribute('aria-live')).toBe('polite');
    expect(estado.textContent).toContain('Todo en orden');
  });
  it('se actualiza cuando cambia la actividad', () => {
    const a = quiz();
    const { actualizar } = montar(a);
    const rota = structuredClone(a);
    rota.preguntas = [];
    actualizar(rota);
    expect(screen.getByRole('status').textContent).toContain('1 problema que impide jugar.');
  });
});

describe('Importar', () => {
  it('no se ofrece para un tipo sin importador', () => {
    montar({ tipo: 'puzzle_imagen', configuracion: { filas: 3, columnas: 3, mostrarVista: true, dificultad: 'facil' }, imagen: '' } as Activity);
    expect(screen.queryByRole('button', { name: /Importar/ })).toBeNull();
  });
  it('muestra el formato, lee lo pegado con vista previa y aplica con onChange', () => {
    const a = quiz();
    const { onChange } = montar(a);
    abrir(/Importar preguntas/);
    expect(screen.getByText(/la correcta lleva \* al inicio/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Pega tu lista/), { target: { value: 'P1;*a;b\nP2;*c;d\nsola;única' } });
    const previa = document.querySelector('[data-vista-previa-importacion]')!;
    expect(previa.textContent).toContain('3 filas pegadas');
    expect(previa.textContent).toContain('se leerán 2');
    expect(previa.textContent).toContain('1 no se pueden leer');
    expect(previa.textContent).toContain('Fila 3: Necesita al menos 2 opciones.');
    fireEvent.click(screen.getByRole('button', { name: 'Agregar a la actividad' }));
    const nueva = onChange.mock.calls[0]![0] as QuizMultiple;
    expect(nueva.preguntas).toHaveLength(a.preguntas.length + 2);
    expect(screen.getByRole('status').textContent).toBe('Se importaron 2 filas y 1 no se pudieron leer.');
  });
  it('reemplazar cambia el botón y deja solo lo importado', () => {
    const { onChange } = montar(quiz());
    abrir(/Importar preguntas/);
    fireEvent.click(screen.getByLabelText('Reemplazar'));
    fireEvent.change(screen.getByLabelText(/Pega tu lista/), { target: { value: 'Solo;*a;b' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reemplazar el contenido' }));
    expect((onChange.mock.calls[0]![0] as QuizMultiple).preguntas).toHaveLength(1);
  });
  it('sin filas legibles el botón queda deshabilitado', () => {
    montar(quiz());
    abrir(/Importar preguntas/);
    fireEvent.change(screen.getByLabelText(/Pega tu lista/), { target: { value: 'nada' } });
    expect((screen.getByRole('button', { name: 'Agregar a la actividad' }) as HTMLButtonElement).disabled).toBe(true);
  });
  it('«Usar el ejemplo» llena el texto con el ejemplo del tipo', () => {
    montar(quiz());
    abrir(/Importar preguntas/);
    fireEvent.click(screen.getByRole('button', { name: 'Usar el ejemplo' }));
    expect((screen.getByLabelText(/Pega tu lista/) as HTMLTextAreaElement).value).toContain('Bogotá');
  });
  it('«Deshacer» devuelve la actividad anterior', () => {
    const a = quiz();
    const { onChange } = montar(a);
    abrir(/Importar preguntas/);
    fireEvent.change(screen.getByLabelText(/Pega tu lista/), { target: { value: 'P;*a;b' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar a la actividad' }));
    fireEvent.click(screen.getByRole('button', { name: 'Deshacer el último cambio' }));
    expect(onChange).toHaveBeenLastCalledWith(a);
    expect(screen.queryByRole('button', { name: 'Deshacer el último cambio' })).toBeNull();
  });
});

describe('Ver como alumno', () => {
  it('monta el Viewer real con la actividad en edición y se puede reiniciar y cerrar', () => {
    const a = quiz();
    a.preguntas[0]!.texto = 'Pregunta de prueba única';
    montar(a);
    abrir(/Ver como alumno/);
    expect(document.querySelector('[data-vista-alumno]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Probar la actividad' }));
    const marco = document.querySelector('[data-vista-alumno]')!;
    expect(marco.textContent).toContain('Pregunta de prueba única');
    fireEvent.click(screen.getByRole('button', { name: 'Reiniciar' }));
    expect(document.querySelector('[data-vista-alumno]')!.textContent).toContain('Pregunta de prueba única');
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(document.querySelector('[data-vista-alumno]')).toBeNull();
  });
  it('responder en la vista previa no cambia la actividad', () => {
    const { onChange } = montar(structuredClone(trueFalseTemplate()));
    abrir(/Ver como alumno/);
    fireEvent.click(screen.getByRole('button', { name: 'Probar la actividad' }));
    const botones = document.querySelectorAll('[data-vista-alumno] button');
    expect(botones.length).toBeGreaterThan(0);
    fireEvent.click(botones[0]!);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Generar con IA (solo interfaz)', () => {
  const generador = (resultado: Awaited<ReturnType<GeneradorActividad['generar']>>, tipos: string[] = ['quiz_multiple']): GeneradorActividad => ({
    soporta: (t) => tipos.includes(t),
    generar: vi.fn().mockResolvedValue(resultado),
  });

  it('sin proveedor, o con un tipo que no soporta, no aparece', () => {
    montar(quiz());
    expect(screen.queryByRole('button', { name: /Generar con IA/ })).toBeNull();
    cleanup();
    montar(quiz(), { generador: generador({ ok: false, mensaje: 'x' }, ['torneo']) });
    expect(screen.queryByRole('button', { name: /Generar con IA/ })).toBeNull();
  });
  it('envía tipo, actividad actual e instrucciones; aplica el resultado y permite deshacer', async () => {
    const generada = { ...quiz(), preguntas: [] } as QuizMultiple;
    const g = generador({ ok: true, actividad: generada });
    const a = quiz();
    const { onChange } = montar(a, { generador: g });
    abrir(/Generar con IA/);
    fireEvent.change(screen.getByLabelText(/Qué quieres que genere/), { target: { value: 'Fotosíntesis, 5 preguntas' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Generar' }));
    });
    expect(g.generar).toHaveBeenCalledWith({ tipo: 'quiz_multiple', actividadActual: a, instrucciones: 'Fotosíntesis, 5 preguntas' });
    expect(onChange).toHaveBeenCalledWith(generada);
    expect(screen.getByRole('status').textContent).toContain('Revísala antes de usarla.');
    fireEvent.click(screen.getByRole('button', { name: 'Deshacer el último cambio' }));
    expect(onChange).toHaveBeenLastCalledWith(a);
  });
  it('si falla muestra el mensaje y no cambia nada', async () => {
    const g = generador({ ok: false, mensaje: 'Sin cupo de IA' });
    const { onChange } = montar(quiz(), { generador: g });
    abrir(/Generar con IA/);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Generar' }));
    });
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Sin cupo de IA'));
    expect(onChange).not.toHaveBeenCalled();
  });
  it('si el generador lanza, avisa sin romper', async () => {
    const g: GeneradorActividad = { soporta: () => true, generar: vi.fn().mockRejectedValue(new Error('boom')) };
    const { onChange } = montar(quiz(), { generador: g });
    abrir(/Generar con IA/);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Generar' }));
    });
    expect(screen.getByRole('status').textContent).toBe('No se pudo generar la actividad.');
    expect(onChange).not.toHaveBeenCalled();
  });
});
