// Fixtures para los tests del video interactivo

export const YOUTUBE_PROVIDERS = [
  {
    name: 'YouTube Watch Format',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    provider: 'youtube',
    videoId: 'dQw4w9WgXcQ',
  },
  {
    name: 'YouTube Short Format',
    url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    provider: 'youtube',
    videoId: 'dQw4w9WgXcQ',
  },
  {
    name: 'YouTube Embed Format',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    provider: 'youtube',
    videoId: 'dQw4w9WgXcQ',
  },
  {
    name: 'YouTube Short URL (youtu.be)',
    url: 'https://youtu.be/dQw4w9WgXcQ',
    provider: 'youtube',
    videoId: 'dQw4w9WgXcQ',
  },
  {
    name: 'YouTube with Query Params',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s&list=ABC123',
    provider: 'youtube',
    videoId: 'dQw4w9WgXcQ',
  },
];

export const VIMEO_PROVIDERS = [
  {
    name: 'Vimeo Embed',
    url: 'https://vimeo.com/90509568',
    provider: 'vimeo',
    videoId: '90509568',
  },
  {
    name: 'Vimeo with Query Params',
    url: 'https://vimeo.com/90509568?h=abc123def456',
    provider: 'vimeo',
    videoId: '90509568',
  },
];

export const HTML5_PROVIDERS = [
  {
    name: 'MP4 Direct URL',
    url: 'https://example.com/video.mp4',
    provider: 'direct',
  },
  {
    name: 'Data Blob URL',
    url: 'blob:https://example.com/uuid',
    provider: 'direct',
  },
];

export const MOCK_QUESTIONS = [
  {
    id: 'q1',
    text: '¿Cuál es la respuesta correcta?',
    startTime: 5,
    type: 'SINGLE_CHOICE' as const,
    options: [
      { id: 'opt1', text: 'Opción A' },
      { id: 'opt2', text: 'Opción B' },
      { id: 'opt3', text: 'Opción C' },
    ],
    correctOptionId: 'opt1',
  },
  {
    id: 'q2',
    text: '¿Cuál de estas es correcta?',
    startTime: 15,
    type: 'SINGLE_CHOICE' as const,
    options: [
      { id: 'opt1', text: 'Primera' },
      { id: 'opt2', text: 'Segunda' },
    ],
    correctOptionId: 'opt2',
  },
  {
    id: 'q3',
    text: 'Pregunta final',
    startTime: 25,
    type: 'SINGLE_CHOICE' as const,
    options: [
      { id: 'opt1', text: 'Sí' },
      { id: 'opt2', text: 'No' },
    ],
    correctOptionId: 'opt1',
  },
];

export const SEEK_BEHAVIOR_MATRIX = [
  { fromTime: 0, toTime: 20, expectBlocked: false, description: 'Forward seek within unlocked range' },
  { fromTime: 20, toTime: 10, expectBlocked: false, description: 'Backward seek (should replay)' },
  { fromTime: 5, toTime: 30, expectBlocked: true, description: 'Forward seek beyond unlocked range' },
  { fromTime: 15, toTime: 5, expectBlocked: false, description: 'Backward seek with replay' },
];

export const NAVIGATION_SCENARIOS = [
  { name: 'Normal click', action: 'click' },
  { name: 'Browser back/forward', action: 'route' },
  { name: 'Full page refresh', action: 'reload' },
];
