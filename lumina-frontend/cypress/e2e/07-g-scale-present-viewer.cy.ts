/// <reference types="cypress" />
import { G_SCALE_CHART_TITLE, G_SCALE_CLASS_ID } from '../fixtures/g-scale';
import { seedGScaleSession } from '../support/g-scale-auth';

describe('G-scale — present y viewer (E2E)', () => {
  beforeEach(() => {
    seedGScaleSession();
    cy.intercept('GET', '**/socket.io/**', { statusCode: 200, body: {} });
  });

  const assertVirtualSlideAndChart = () => {
    cy.get('[data-testid="g-scale-slide-stage"]', { timeout: 15000 }).should('exist');
    cy.get('[data-virtual-slide-surface]').should('exist');
    cy.contains(G_SCALE_CHART_TITLE).should('be.visible');
    cy.get('.apexcharts-canvas', { timeout: 12000 }).should('exist');
  };

  it('present: SlideRenderer con superficie virtual y gráfico legible', () => {
    cy.visit(`/classes/${G_SCALE_CLASS_ID}/present`, { failOnStatusCode: false });
    cy.wait('@classDetailGlob');
    assertVirtualSlideAndChart();
  });

  it('viewer: misma paridad de escala en ruta de estudiante', () => {
    cy.visit(`/classes/${G_SCALE_CLASS_ID}/viewer`, { failOnStatusCode: false });
    cy.wait('@classDetailGlob');
    assertVirtualSlideAndChart();
  });

  it('present: superficie interna mantiene layout virtual 1280×720', () => {
    cy.visit(`/classes/${G_SCALE_CLASS_ID}/present`, { failOnStatusCode: false });
    cy.wait('@classDetailGlob');
    cy.get('[data-virtual-slide-surface]', { timeout: 15000 }).then(($surf) => {
      const el = $surf[0] as HTMLElement;
      expect(el.offsetWidth).to.eq(1280);
      expect(el.offsetHeight).to.eq(720);
    });
  });
});
