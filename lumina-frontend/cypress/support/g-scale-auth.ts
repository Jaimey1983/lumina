import { gScaleAuthUser, gScaleClassDetail, G_SCALE_CLASS_ID } from '../fixtures/g-scale';

const API_BASE = Cypress.env('API_URL') ?? 'http://localhost:3000';

/** Sesión falsa + mocks de API para rutas `/classes/:id/present|viewer`. */
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
}
