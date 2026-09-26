/// <reference types="cypress" />
import {
  G_SCALE_CHART_TITLE,
  G_SCALE_CLASS_ID,
  G_SCALE_DIAGRAM_TITLE,
  G_SCALE_SESSION_ID,
  G_SCALE_TIMELINE_TITLE,
} from '../fixtures/g-scale';
import { seedGScaleAutonomoSession, seedGScaleSession } from '../support/g-scale-auth';

describe('G-scale — editor, miniatura y autónomo (E2E)', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/socket.io/**', { statusCode: 200, body: {} });
  });

  it('editor: lienzo con VirtualSlideSurface 1280×720 y gráfico', () => {
    seedGScaleSession();
    cy.visit(`/classes/${G_SCALE_CLASS_ID}/editor`, { failOnStatusCode: false });
    cy.wait('@classDetailGlob');
    cy.get('[data-testid="g-scale-editor-surface"]', { timeout: 20000 }).should('exist');
    cy.get('[data-virtual-slide-surface]').should('exist');
    cy.contains(G_SCALE_CHART_TITLE).should('be.visible');
    cy.get('[data-testid="g-scale-editor-surface"]').then(($surf) => {
      const el = $surf[0] as HTMLElement;
      expect(el.offsetWidth).to.eq(1280);
      expect(el.offsetHeight).to.eq(720);
    });
    cy.get('[data-block-id="0"]').should('exist');
  });

  it('editor: miniatura del panel lateral escala el mismo slide (preview)', () => {
    seedGScaleSession();
    cy.visit(`/classes/${G_SCALE_CLASS_ID}/editor`, { failOnStatusCode: false });
    cy.wait('@classDetailGlob');
    cy.get('[data-testid="g-scale-slide-thumb"]', { timeout: 20000 })
      .first()
      .within(() => {
        cy.get('[data-virtual-slide-surface]').should('exist');
        cy.contains(G_SCALE_CHART_TITLE).should('exist');
      });
  });

  it('autónomo: tras join, viewer con superficie virtual y gráfico', () => {
    seedGScaleAutonomoSession();
    cy.visit(`/autonomo/${G_SCALE_SESSION_ID}`, { failOnStatusCode: false });
    cy.wait('@autonomoSessionGlob');
    cy.get('#autonomo-student-name').type('Estudiante E2E');
    cy.get('#autonomo-pin').type('123456');
    cy.get('#btn-comenzar').click();
    cy.wait('@autonomoJoin');
    cy.get('[data-testid="g-scale-slide-stage"]', { timeout: 20000 }).should('exist');
    cy.get('[data-virtual-slide-surface]').should('exist');
    cy.contains(G_SCALE_CHART_TITLE).should('be.visible');
  });

  it('present: slide 2 timeline y slide 3 diagrama navegables', () => {
    seedGScaleSession();
    cy.visit(`/classes/${G_SCALE_CLASS_ID}/present`, { failOnStatusCode: false });
    cy.wait('@classDetailGlob');
    cy.contains(G_SCALE_CHART_TITLE).should('be.visible');
    cy.get('[aria-label="Diapositiva siguiente"]').click();
    cy.contains(G_SCALE_TIMELINE_TITLE, { timeout: 15000 }).should('be.visible');
    cy.get('[aria-label="Diapositiva siguiente"]').click();
    cy.contains(G_SCALE_DIAGRAM_TITLE, { timeout: 15000 }).should('be.visible');
  });
});
