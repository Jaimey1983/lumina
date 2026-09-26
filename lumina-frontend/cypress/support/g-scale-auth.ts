import {
  gScaleAuthUser,
  gScaleAutonomousSession,
  gScaleClassDetail,
  G_SCALE_CLASS_ID,
  G_SCALE_SESSION_ID,
} from '../fixtures/g-scale';

const API_BASE = Cypress.env('API_URL') ?? 'http://localhost:3000';

/** Sesión falsa + mocks de API para rutas `/classes/:id/*` (app autenticada). */
export function seedGScaleSession(): void {
  cy.window().then((win) => {
    win.localStorage.setItem('token', 'e2e-g-scale-token');
    win.localStorage.setItem('lumina_user', JSON.stringify(gScaleAuthUser));
  });

  cy.intercept('GET', `${API_BASE}/auth/me`, {
    statusCode: 200,
    body: gScaleAuthUser,
  }).as('authMe');

  cy.intercept('GET', `${API_BASE}/classes/${G_SCALE_CLASS_ID}`, {
    statusCode: 200,
    body: gScaleClassDetail,
  }).as('classDetail');

  cy.intercept('GET', `**/classes/${G_SCALE_CLASS_ID}`, {
    statusCode: 200,
    body: gScaleClassDetail,
  }).as('classDetailGlob');

  cy.intercept('PATCH', `**/classes/${G_SCALE_CLASS_ID}/**`, {
    statusCode: 200,
    body: {},
  }).as('classPatch');

  cy.intercept('PATCH', `**/classes/${G_SCALE_CLASS_ID}`, {
    statusCode: 200,
    body: gScaleClassDetail,
  }).as('classUpdate');
}

/** Mocks para `/autonomo/:sessionId` (sin login de docente). */
export function seedGScaleAutonomoSession(): void {
  const session = gScaleAutonomousSession();

  cy.intercept('GET', `${API_BASE}/autonomous-sessions/${G_SCALE_SESSION_ID}`, {
    statusCode: 200,
    body: session,
  }).as('autonomoSession');

  cy.intercept('GET', `**/autonomous-sessions/${G_SCALE_SESSION_ID}`, {
    statusCode: 200,
    body: session,
  }).as('autonomoSessionGlob');

  cy.intercept('POST', `**/autonomous-sessions/${G_SCALE_SESSION_ID}/join`, {
    statusCode: 200,
    body: {
      studentId: 'e2e-student-gscale',
      attemptNumber: 1,
      resuming: false,
      session,
    },
  }).as('autonomoJoin');

  cy.intercept('POST', `**/autonomous-sessions/${G_SCALE_SESSION_ID}/progress`, {
    statusCode: 200,
    body: {},
  }).as('autonomoProgress');
}
