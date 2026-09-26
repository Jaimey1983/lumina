/** Clase mínima para E2E G-scale (present / viewer) — sin backend real. */

export const G_SCALE_CLASS_ID = 'e2e-g-scale-class';

export const G_SCALE_CHART_TITLE = 'Notas del período';

const graficoBlock = {
  tipo: 'grafico',
  id: 'e2e-grafico',
  x: 4,
  y: 6,
  ancho: 92,
  alto: 88,
  titulo: G_SCALE_CHART_TITLE,
  chartType: 'column',
  categorias: ['Ene', 'Feb', 'Mar'],
  series: [{ nombre: 'Grupo A', valores: [65, 59, 80] }],
};

export const gScaleClassDetail = {
  id: G_SCALE_CLASS_ID,
  title: 'E2E G-scale',
  description: 'Fixture Cypress',
  courseId: 'e2e-course',
  status: 'PUBLISHED',
  modoEntrega: 'presentacion',
  background: 'blanco',
  createdAt: '2026-01-01T00:00:00.000Z',
  slides: [
    {
      id: 'e2e-slide-1',
      order: 1,
      type: 'CONTENT',
      title: 'Gráfico demo',
      contentVersion: 1,
      content: {
        fondo: { tipo: 'color', valor: '#ffffff' },
        layout: 'en_blanco',
        bloques: [graficoBlock],
      },
    },
  ],
};

export const gScaleAuthUser = {
  id: 'e2e-user',
  name: 'E2E',
  lastName: 'Teacher',
  email: 'e2e@lumina.test',
  role: 'TEACHER',
};
