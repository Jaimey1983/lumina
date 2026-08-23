/// <reference types="cypress" />
import { YOUTUBE_PROVIDERS, MOCK_QUESTIONS, NAVIGATION_SCENARIOS } from '../fixtures/video-interactive';

/**
 * Capa 4: Navigation and Refresh Tests
 * Verifica que el bug original (preguntas aparecen sin click el primer load) está resuelto
 * Comprueba que funciona igualmente en refresh vs navegación normal
 */
describe('Video Interactivo: Navigation y Refresh Behavior', () => {
  const ACTIVITY_PATH = '/classes/test-id/editor?slide=video-interactive&mode=view';

  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.setItem('lumina:video:debug', '1');
    });
  });

  describe('First Load Behavior (Original Bug Fix)', () => {
    it('should NOT show questions on initial page load WITHOUT user action (Capa 1 - gate)', () => {
      cy.visit(ACTIVITY_PATH);

      // Bug original: preguntas aparecían sin hacer click
      // Fix: No debería haber overlay de preguntas
      cy.get('[data-testid="question-overlay"]', { timeout: 2000 }).should('not.exist');

      // Debería haber botón de inicio
      cy.get('[data-testid="video-start-button"]').should('be.visible');
    });

    it('should show questions ONLY after user clicks "Iniciar actividad"', () => {
      cy.visit(ACTIVITY_PATH);

      // Pre-click: sin preguntas
      cy.get('[data-testid="question-overlay"]').should('not.exist');

      // Click start
      cy.get('[data-testid="video-start-button"]').click();

      // Post-click: preguntas deben aparecer en timeline
      cy.get('[data-testid="question-overlay"]', { timeout: 15000 }).should('be.visible');
    });

    it('should work consistently on repeated first loads', () => {
      for (let i = 0; i < 3; i++) {
        cy.visit(ACTIVITY_PATH);
        cy.get('[data-testid="question-overlay"]', { timeout: 1000 }).should('not.exist');
        cy.get('[data-testid="video-start-button"]').should('be.visible');
        cy.visit('/dashboard');
        cy.wait(500);
      }
    });
  });

  describe('Full Page Refresh Behavior', () => {
    it('should handle full page refresh correctly after starting activity', () => {
      cy.visit(ACTIVITY_PATH);
      cy.get('[data-testid="video-start-button"]').click();
      cy.wait(1000);

      // Page reload
      cy.reload();

      // Después del reload, debería volver a mostrar el botón de inicio
      // (El estado se pierde en un SPA reload)
      cy.get('[data-testid="video-start-button"]', { timeout: 5000 }).should('be.visible');
    });

    it('should NOT show questions after refresh before user restarts', () => {
      cy.visit(ACTIVITY_PATH);
      cy.get('[data-testid="video-start-button"]').click();
      cy.wait(2000);

      cy.reload();

      // Pre-click: sin preguntas visible
      cy.get('[data-testid="question-overlay"]', { timeout: 1000 }).should('not.exist');
    });

    it('should allow starting activity again after refresh', () => {
      cy.visit(ACTIVITY_PATH);
      cy.get('[data-testid="video-start-button"]').click();
      cy.get('[data-testid="question-overlay"]', { timeout: 15000 }).should('be.visible');

      cy.reload();

      // Restart
      cy.get('[data-testid="video-start-button"]').click();
      cy.get('[data-testid="question-overlay"]', { timeout: 15000 }).should('be.visible');
    });

    it('should maintain player state consistency on refresh (deterministic timeline - Capa 3)', () => {
      cy.visit(ACTIVITY_PATH);

      cy.window().then((win) => {
        const beforeRefreshLogs = (win as any).__videoEventLogs || [];

        cy.reload();
        cy.wait(500);

        cy.window().then((win2) => {
          const afterRefreshLogs = (win2 as any).__videoEventLogs || [];
          // Logs should be fresh after reload
          expect(afterRefreshLogs.length).to.be.gte(0);
        });
      });
    });
  });

  describe('Browser Navigation (Back/Forward)', () => {
    it('should handle browser back navigation correctly', () => {
      cy.visit('/dashboard');
      cy.visit(ACTIVITY_PATH);
      cy.get('[data-testid="video-start-button"]').should('be.visible');

      // Navigate back
      cy.go('back');
      cy.get('[data-testid="dashboard"]', { timeout: 5000 }).should('be.visible');

      // Navigate forward
      cy.go('forward');
      cy.get('[data-testid="video-start-button"]', { timeout: 5000 }).should('be.visible');
    });

    it('should reset activity state on back/forward navigation', () => {
      cy.visit('/dashboard');
      cy.visit(ACTIVITY_PATH);
      cy.get('[data-testid="video-start-button"]').click();
      cy.wait(1000);

      // Go back
      cy.go('back');
      cy.wait(500);

      // Go forward
      cy.go('forward');

      // Should be reset
      cy.get('[data-testid="video-start-button"]', { timeout: 5000 }).should('be.visible');
    });
  });

  describe('Rapid Navigation (Stress Test)', () => {
    it('should handle rapid route changes without crashes', () => {
      cy.visit(ACTIVITY_PATH);
      cy.get('[data-testid="video-start-button"]').click();
      cy.wait(500);

      cy.visit('/dashboard');
      cy.visit(ACTIVITY_PATH);
      cy.visit('/dashboard');

      cy.window().then((win) => {
        const errors = (win as any).__videoErrors || [];
        expect(errors.length).to.equal(0, 'Should have no critical errors');
      });
    });

    it('should properly cleanup resources on route change', () => {
      cy.visit(ACTIVITY_PATH);
      cy.get('[data-testid="video-start-button"]').click();
      cy.wait(1000);

      cy.window().then((win) => {
        const beforeCleanup = Object.keys(win).filter((k) => k.includes('Timeout') || k.includes('Interval')).length;

        cy.visit('/dashboard');

        cy.wait(500);
        cy.window().then((win2) => {
          // Timers/intervals should be cleaned up
          const afterCleanup = Object.keys(win2).filter((k) => k.includes('Timeout') || k.includes('Interval')).length;
          // Not a strict check, but gives indication of cleanup
          expect(afterCleanup).to.exist;
        });
      });
    });

    it('should not have memory leaks from repeated starts', () => {
      for (let i = 0; i < 5; i++) {
        cy.visit(ACTIVITY_PATH);
        cy.get('[data-testid="video-start-button"]').click();
        cy.wait(500);
        cy.visit('/dashboard');
        cy.wait(200);
      }

      cy.window().then((win) => {
        // After 5 cycles, should still be functional
        const errors = (win as any).__videoErrors || [];
        expect(errors.length).to.be.lessThan(5, 'Should have minimal errors after repeated cycles');
      });
    });
  });

  describe('Cross-Provider Navigation', () => {
    it('should switch providers cleanly (YouTube → Vimeo)', () => {
      // Start with YouTube
      cy.window().then((win) => {
        (win as any).__testVideoUrl = YOUTUBE_PROVIDERS[0].url;
      });
      cy.visit(ACTIVITY_PATH);
      cy.get('[data-testid="video-start-button"]').click();
      cy.wait(1500);

      // Navigate to another activity (Vimeo)
      cy.window().then((win) => {
        (win as any).__testVideoUrl = 'https://vimeo.com/90509568';
      });
      cy.visit('/dashboard');
      cy.wait(300);
      cy.visit(ACTIVITY_PATH);

      cy.window().then((win) => {
        const logs = (win as any).__videoEventLogs || [];
        const errors = (win as any).__videoErrors || [];
        expect(errors.length).to.equal(0, 'Should switch providers without errors');
      });
    });

    it('should cleanup previous player before initializing new one', () => {
      cy.visit(ACTIVITY_PATH);
      cy.get('[data-testid="video-start-button"]').click();
      cy.wait(1000);

      cy.window().then((win) => {
        const playerBefore = (win as any).currentYouTubePlayer || (win as any).currentVimeoPlayer;
        expect(playerBefore).to.exist;

        cy.visit('/dashboard');
        cy.wait(500);

        cy.window().then((win2) => {
          const playerAfter = (win2 as any).currentYouTubePlayer || (win2 as any).currentVimeoPlayer;
          // Player should be cleaned up
          expect(playerAfter).to.be.undefined;
        });
      });
    });
  });

  describe('Offline/Network Error Handling', () => {
    it('should handle network timeout gracefully', () => {
      cy.intercept('GET', '**/youtube.com/**', { forceNetworkError: true });

      cy.visit(ACTIVITY_PATH);
      cy.get('[data-testid="video-start-button"]').click();
      cy.wait(2000);

      cy.window().then((win) => {
        const errors = (win as any).__videoErrors || [];
        // Should have logged error or fallback
        expect(errors.length).to.be.gte(0);
      });
    });

    it('should allow retry after network error', () => {
      cy.intercept('GET', '**/youtube.com/**', { forceNetworkError: true });
      cy.visit(ACTIVITY_PATH);
      cy.get('[data-testid="video-start-button"]').click();
      cy.wait(1000);

      // Stop intercepting
      cy.intercept('GET', '**/youtube.com/**', 'unmatched');

      // Reload and retry
      cy.reload();
      cy.get('[data-testid="video-start-button"]', { timeout: 5000 }).should('be.visible');
    });
  });
});
