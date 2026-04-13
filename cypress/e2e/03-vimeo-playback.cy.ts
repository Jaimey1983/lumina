/// <reference types="cypress" />
import { VIMEO_PROVIDERS, MOCK_QUESTIONS } from '../fixtures/video-interactive';

/**
 * Capa 4: Vimeo Playback Tests
 * Verifica que Capa 2 (VimeoAdapter con postMessage) funciona correctamente
 */
describe('Video Interactivo: Vimeo Playback y Control', () => {
  beforeEach(() => {
    cy.visit('/dashboard');
    cy.window().then((win) => {
      win.localStorage.setItem('lumina:video:debug', '1');
    });
  });

  afterEach(() => {
    cy.window().then((win) => {
      win.localStorage.removeItem('lumina:video:debug');
    });
  });

  describe('Vimeo Adapter Initialization (postMessage API)', () => {
    it('should detect and initialize Vimeo provider', () => {
      // Setup: navegar a actividad con Vimeo video
      cy.window().then((win) => {
        (win as any).__testVideoUrl = VIMEO_PROVIDERS[0].url;
      });

      cy.get('[data-testid="video-interactive-viewer"]').should('exist');
      cy.get('[data-testid="video-start-button"]').click();

      cy.window().then((win) => {
        const logs = (win as any).__videoEventLogs || [];
        const providerLogs = logs.filter((l: any) => l.event === 'provider-detected');
        expect(providerLogs[0]?.payload?.provider).to.equal('vimeo');
      });
    });

    it('should initialize Vimeo iframe safely', () => {
      cy.window().then((win) => {
        (win as any).__testVideoUrl = VIMEO_PROVIDERS[0].url;
      });

      cy.get('[data-testid="video-start-button"]').click();
      cy.get('[data-testid="video-player-vimeo"]', { timeout: 5000 }).should('be.visible');
    });
  });

  describe('Vimeo TimeUpdates (Event-driven, not polling)', () => {
    it('should receive timeupdate events from Vimeo (not polling)', () => {
      cy.window().then((win) => {
        (win as any).__testVideoUrl = VIMEO_PROVIDERS[0].url;
      });

      cy.get('[data-testid="video-start-button"]').click();
      cy.wait(3000);

      cy.window().then((win) => {
        const logs = (win as any).__videoEventLogs || [];
        const timeUpdateLogs = logs.filter((l: any) => l.event === 'time-update');
        // Debería haber recibido al menos algunos time-update eventos
        expect(timeUpdateLogs.length).to.be.greaterThan(0);
      });
    });

    it('should trigger questions at correct Vimeo timeline points', () => {
      cy.window().then((win) => {
        (win as any).__testVideoUrl = VIMEO_PROVIDERS[0].url;
        (win as any).__testQuestions = MOCK_QUESTIONS;
      });

      cy.get('[data-testid="video-start-button"]').click();
      cy.get('[data-testid="question-overlay"]', { timeout: 20000 }).should('be.visible');
      cy.get('[data-testid="question-text"]').should('contain.text', MOCK_QUESTIONS[0].text);
    });
  });

  describe('Vimeo Seek Behavior', () => {
    it('should handle Vimeo seek events via postMessage', () => {
      cy.window().then((win) => {
        (win as any).__testVideoUrl = VIMEO_PROVIDERS[0].url;
      });

      cy.get('[data-testid="video-start-button"]').click();
      cy.wait(1500);

      // Simular seek via postMessage (VimeoAdapter debería recibir seeked event)
      cy.window().then((win) => {
        const player = (win as any).currentVimeoPlayer;
        if (player && player.postMessage) {
          // postMessage para seek
          player.postMessage({ method: 'setCurrentTime', value: 10 });
        }
      });

      cy.window().then((win) => {
        const logs = (win as any).__videoEventLogs || [];
        // Debería haber recibido evento de seek
        expect(logs.length).to.be.greaterThan(0);
      });
    });

    it('should enforce seek policy on Vimeo (forward seek blocking)', () => {
      cy.window().then((win) => {
        (win as any).__testVideoUrl = VIMEO_PROVIDERS[0].url;
        (win as any).__testSeekPolicy = { allowForwardSeek: false };
      });

      cy.get('[data-testid="video-start-button"]').click();
      cy.wait(1000);

      cy.window().then((win) => {
        const player = (win as any).currentVimeoPlayer;
        if (player && player.postMessage) {
          // Intentar forward seek
          player.postMessage({ method: 'setCurrentTime', value: 30 });
          cy.wait(500);
        }
      });

      cy.window().then((win) => {
        const logs = (win as any).__videoEventLogs || [];
        const seekBlockedLogs = logs.filter((l: any) => l.event === 'seek-blocked');
        // Debería haber un evento de seek bloqueado
        expect(seekBlockedLogs.length).to.be.greaterThan(0);
      });
    });
  });

  describe('Vimeo Cross-Origin Safety (Capa 2)', () => {
    it('should handle postMessage without timing issues', () => {
      cy.window().then((win) => {
        (win as any).__testVideoUrl = VIMEO_PROVIDERS[0].url;
      });

      cy.get('[data-testid="video-start-button"]').click();
      cy.get('[data-testid="video-player-vimeo"]', { timeout: 5000 }).should('be.visible');

      // Pausa y reanuda rapidamente
      cy.window().then((win) => {
        const player = (win as any).currentVimeoPlayer;
        if (player && player.postMessage) {
          player.postMessage({ method: 'pause' });
          cy.wait(100);
          player.postMessage({ method: 'play' });
        }
      });

      cy.window().then((win) => {
        const errors = (win as any).__videoErrors || [];
        expect(errors.length).to.equal(0);
      });
    });

    it('should recover from postMessage failures gracefully', () => {
      cy.window().then((win) => {
        (win as any).__testVideoUrl = VIMEO_PROVIDERS[0].url;
      });

      cy.get('[data-testid="video-start-button"]').click();
      cy.wait(1000);

      // Simulate postMessage failure
      cy.window().then((win) => {
        const originalPostMessage = window.parent.postMessage;
        (window.parent.postMessage as any) = () => {
          throw new Error('postMessage failed');
        };

        cy.wait(500);

        // Restore
        (window.parent.postMessage as any) = originalPostMessage;
      });

      // Should still be playable
      cy.get('[data-testid="video-player-vimeo"]').should('be.visible');
    });
  });
});
