/** Fixtures E2E G-scale — present, viewer, editor, autónomo. */

export const G_SCALE_CLASS_ID = 'e2e-g-scale-class';
export const G_SCALE_SESSION_ID = 'e2e-g-scale-session';

export const G_SCALE_CHART_TITLE = 'Notas del período';
export const G_SCALE_TIMELINE_TITLE = 'Línea E2E G-scale';
export const G_SCALE_DIAGRAM_TITLE = 'Mapa E2E G-scale';

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

const timelineWidget = {
  tipo: 'timeline',
  id: 'e2e-timeline',
  x: 5,
  y: 8,
  ancho: 90,
  alto: 84,
  tituloWidget: G_SCALE_TIMELINE_TITLE,
  nodos: [
    { id: 'n1', titulo: 'Inicio', descripcion: 'Punto A', fecha: '2026-01-01' },
    { id: 'n2', titulo: 'Hito', descripcion: 'Punto B', fecha: '2026-06-01' },
  ],
};

const diagramaBlock = {
  tipo: 'diagrama',
  subtipo: 'mapa_mental',
  id: 'e2e-diagrama',
  x: 6,
  y: 10,
  ancho: 88,
  alto: 80,
  titulo: G_SCALE_DIAGRAM_TITLE,
  nodos: [
    { id: 'raiz', etiqueta: 'Centro', x: 200, y: 100 },
    { id: 'hijo', etiqueta: 'Rama', x: 100, y: 50 },
  ],
  aristas: [{ id: 'a1', desdeId: 'raiz', haciaId: 'hijo' }],
};

export function gScaleApiSlides() {
  return [
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
    {
      id: 'e2e-slide-2',
      order: 2,
      type: 'CONTENT',
      title: 'Timeline demo',
      contentVersion: 1,
      content: {
        fondo: { tipo: 'color', valor: '#ffffff' },
        layout: 'en_blanco',
        bloques: [timelineWidget],
      },
    },
    {
      id: 'e2e-slide-3',
      order: 3,
      type: 'CONTENT',
      title: 'Diagrama demo',
      contentVersion: 1,
      content: {
        fondo: { tipo: 'color', valor: '#ffffff' },
        layout: 'en_blanco',
        bloques: [diagramaBlock],
      },
    },
  ];
}

export const gScaleClassDetail = {
  id: G_SCALE_CLASS_ID,
  title: 'E2E G-scale',
  description: 'Fixture Cypress',
  courseId: 'e2e-course',
  status: 'PUBLISHED',
  modoEntrega: 'presentacion',
  background: 'blanco',
  createdAt: '2026-01-01T00:00:00.000Z',
  slides: gScaleApiSlides(),
};

export const gScaleAuthUser = {
  id: 'e2e-user',
  name: 'E2E',
  lastName: 'Teacher',
  email: 'e2e@lumina.test',
  role: 'TEACHER',
};

export function gScaleAutonomousSession() {
  const opensAt = new Date(Date.now() - 60_000).toISOString();
  const closesAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  return {
    id: G_SCALE_SESSION_ID,
    classId: G_SCALE_CLASS_ID,
    opensAt,
    closesAt,
    allowBackNav: true,
    maxAttempts: 3,
    timerBehavior: 'advance' as const,
    status: 'open' as const,
    pin: '123456',
    background: 'blanco',
    class: {
      id: G_SCALE_CLASS_ID,
      title: 'E2E G-scale autónomo',
      codigo: 'E2E-GS',
      background: 'blanco',
      slides: gScaleApiSlides(),
    },
  };
}
