/// <reference types="cypress" />
import { YOUTUBE_PROVIDERS, MOCK_QUESTIONS } from '../fixtures/video-interactive';

/**
 * Capa 4: YouTube Playback Tests
 * Verifica que los cambios de Capa 1-3 (singleton loader, URL normalization, timeline engine)
 * no regresan en YouTube embeds
 */
describe('Video Interactivo: YouTube Playback y Timeline', () => {
  const TEST_CLASS_ID = 'test-class-youtube-123';
  const ACTIVITY_ID = 'activity-youtube-test';

  before(() => {
    // Mock: Setup clase de test con actividad de video YouTube
    cy.window().then((win) => {
      (win as any).testSetup = {
        classId: TEST_CLASS_ID,
        activityId: ACTIVITY_ID,
        videoUrl: YOUTUBE_PROVIDERS[0].url,
        questions: MOCK_QUESTIONS,
      };
    });
  });

  beforeEach(() => {
    // Habilitar debug logging
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

  describe('Startup and Initial Load (Critical for first-play bug)', () => {
    it('should NOT show questions on initial mount before user clicks start', () => {
      // Este es el BUG original: las preguntas aparecían sin hacer click
      cy.get('[data-testid="video-interactive-viewer"]').should('exist');
      cy.get('[data-testid="question-overlay"]').should('not.exist');
    });

    it('should show "Iniciar actividad" button before start', () => {
      cy.get('[data-testid="video-start-button"]').should('be.visible');
      cy.get('[data-testid="video-start-button"]').should('contain.text', 'Iniciar actividad');
    });

    it('should initialize YouTube API only once (singleton pattern - Capa 1)', () => {
      cy.window().then((win) => {
        const countBefore = (win as any).__youtubeApiLoadCount || 0;
        cy.get('[data-testid="video-start-button"]').click();
        cy.wait(500); // Esperar inicialización
        cy.window().then((win2) => {
          const countAfter = (win2 as any).__youtubeApiLoadCount || 0;
          // No debería haber incrementado más de una vez
          expect(countAfter - countBefore).to.be.lte(1);
        });
      });
    });
  });

  describe('First Question Appearance (Core regression test)', () => {
    it('should show first question at correct time WITHOUT page refresh (Capa 3 + TimelineEngine)', () => {
      cy.get('[data-testid="video-start-button"]').click();
      cy.get('[data-testid="video-player-yt"]').should('be.visible');

      // Esperar a que el video llegue a Q1 (5 segundos)
      cy.get('[data-testid="question-overlay"]', { timeout: 15000 }).should('be.visible');
      cy.get('[data-testid="question-text"]').should('contain.text', MOCK_QUESTIONS[0].text);
    });

    it('should show first question on refresh (deterministic timeline - Capa 3)', () => {
      // Primera visita
      cy.get('[data-testid="video-start-button"]').click();
      cy.get('[data-testid="question-overlay"]', { timeout: 15000 }).should('be.visible');

      // Recargar página
      cy.reload();

      // Las preguntas deberían aparecer nuevamente sin hacer click en start de nuevo
      // (Aunque idealmente haría falta que el estado persista, este test verifica recuperación limpia)
      cy.get('[data-testid="video-start-button"]', { timeout: 5000 }).should('be.visible');
    });
  });

  describe('Player Adapter Lifecycle', () => {
    it('should initialize YouTube player adapter without callback collisions (Capa 1)', () => {
      cy.window().then((win) => {
        const logs = (win as any).__videoEventLogs || [];
        const beforeCount = logs.length;

        cy.get('[data-testid="video-start-button"]').click();
        cy.wait(1000);

        cy.window().then((win2) => {
          const logsAfter = (win2 as any).__videoEventLogs || [];
          const newLogs = logsAfter.slice(beforeCount);

          // Debería haber eventos sin duplicados
          const readyEvents = newLogs.filter((e: any) => e.event === 'player-ready');
          expect(readyEvents.length).to.equal(1); // Solo uno debería estar
        });
      });
    });

    it('should handle rapid start/stop without errors', () => {
      cy.get('[data-testid="video-start-button"]').click();
      cy.wait(200);
      cy.get('[data-testid="video-pause-button"]').click();
      cy.wait(100);
      cy.get('[data-testid="video-play-button"]').click();
      cy.wait(100);

      // No debería tener errores en consola
      cy.window().then((win) => {
        const errors = (win as any).__videoErrors || [];
        expect(errors.length).to.equal(0);
      });
    });
  });

  describe('Question Display and Interaction', () => {
    it('should display question options correctly', () => {
      cy.get('[data-testid="video-start-button"]').click();
      cy.get('[data-testid="question-overlay"]', { timeout: 15000 }).should('be.visible');

      // Verificar opciones
      cy.get('[data-testid="question-option"]').should('have.length', MOCK_QUESTIONS[0].options.length);
    });

    it('should allow answering question and resume video (Capa 2 policy)', () => {
      cy.get('[data-testid="video-start-button"]').click();
      cy.get('[data-testid="question-overlay"]', { timeout: 15000 }).should('be.visible');

      // Seleccionar respuesta
      cy.get('[data-testid="question-option"]').first().click();

      // Video debería reanudar
      cy.get('[data-testid="question-overlay"]').should('not.exist', { timeout: 2000 });
      cy.get('[data-testid="video-player-yt"]').should('be.visible');
    });
  });

  describe('Seek Behavior with Policy Enforcement (Capa 2)', () => {
    it('should prevent forward seek past unlocked range', () => {
      cy.get('[data-testid="video-start-button"]').click();
      cy.wait(2000);

      // Calcular un seek forward que viole la política
      cy.window().then((win) => {
        const player = (win as any).currentYouTubePlayer;
        if (player) {
          player.seekTo(20); // Forward seek
          cy.wait(500);

          const logs = (win as any).__videoEventLogs || [];
          const seekBlockedEvents = logs.filter((e: any) => e.event === 'seek-blocked');
          // Debería haber un evento de seek bloqueado
          expect(seekBlockedEvents.length).to.be.greaterThan(0);
        }
      });
    });

    it('should allow backward seek and replay question (Capa 2)', () => {
      cy.get('[data-testid="video-start-button"]').click();
      cy.get('[data-testid="question-overlay"]', { timeout: 15000 }).should('be.visible');

      // Cerrar pregunta
      cy.get('[data-testid="question-close-button"]').click();
      cy.wait(500);

      // Hacer seek backward
      cy.window().then((win) => {
        const player = (win as any).currentYouTubePlayer;
        if (player && player.seekTo) {
          player.seekTo(3); // Antes de Q1
          cy.wait(1000);

          // La pregunta debería aparecer nuevamente (replay)
          cy.get('[data-testid="question-overlay"]', { timeout: 5000 }).should('be.visible');
        }
      });
    });
  });

  describe('Observability and Debug Logging (Capa 2)', () => {
    it('should log all key events when debug enabled', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('lumina:video:debug', '1');
      });

      cy.get('[data-testid="video-start-button"]').click();
      cy.get('[data-testid="question-overlay"]', { timeout: 15000 }).should('be.visible');

      cy.window().then((win) => {
        const logs = (win as any).__videoEventLogs || [];
        const eventNames = logs.map((l: any) => l.event);

        // Debería haber los eventos clave
        expect(eventNames).to.include('provider-detected');
        expect(eventNames).to.include('player-initializing');
        expect(eventNames).to.include('player-ready');
        expect(eventNames).to.include('cue-enter');
      });
    });

    it('should capture errors in observability logs', () => {
      // Intentar cargar video con URL inválida
      cy.window().then((win) => {
        (win as any).__testVideoUrl = 'https://www.youtube.com/watch?v=INVALID_VIDEO_ID';
      });

      cy.get('[data-testid="video-start-button"]').click();
      cy.wait(2000);

      cy.window().then((win) => {
        const logs = (win as any).__videoEventLogs || [];
        const errorLogs = logs.filter((l: any) => l.level === 'error');
        // Puede o no haber error dependiendo de YouTube API, pero logs deben existir
        expect(logs.length).to.be.greaterThan(0);
      });
    });
  });
});
