/// <reference types="cypress" />
import { SEEK_BEHAVIOR_MATRIX, MOCK_QUESTIONS } from '../fixtures/video-interactive';

/**
 * Capa 4: Seek Behavior Matrix Tests
 * Valida que TimelineEngine (Capa 3) + SeekPolicy (Capa 2) funcionan correctamente
 */
describe('Video Interactivo: Seek Behavior Matrix (Capa 2-3)', () => {
  beforeEach(() => {
    cy.visit('/dashboard');
    cy.window().then((win) => {
      win.localStorage.setItem('lumina:video:debug', '1');
      (win as any).__testQuestions = MOCK_QUESTIONS;
    });
  });

  afterEach(() => {
    cy.window().then((win) => {
      win.localStorage.removeItem('lumina:video:debug');
    });
  });

  describe('SeekPolicy: allowForwardSeek = false (por defecto)', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        (win as any).__testSeekPolicy = { allowForwardSeek: false, replayOnSeekBack: true };
      });
    });

    it('should block forward seek beyond unlocked range', () => {
      cy.visit('/dashboard');
      cy.get('[data-testid="video-start-button"]').click();
      cy.wait(2000);

      // Intentar seek forward más allá de Q2 (15s)
      cy.window().then((win) => {
        const player = (win as any).currentYouTubePlayer;
        if (player && player.seekTo) {
          player.seekTo(30);
          cy.wait(500);
        }
      });

      cy.window().then((win) => {
        const logs = (win as any).__videoEventLogs || [];
        const seekBlockedLogs = logs.filter((l: any) => l.event === 'seek-blocked');
        expect(seekBlockedLogs.length).to.be.greaterThan(0, 'Forward seek should be blocked');
      });
    });

    it('should allow forward seek within unlocked range', () => {
      cy.get('[data-testid="video-start-button"]').click();
      cy.wait(1000);

      // Seek forward pero dentro del rango desbloqueado (antes de Q2 @ 15s)
      cy.window().then((win) => {
        const player = (win as any).currentYouTubePlayer;
        if (player && player.seekTo) {
          player.seekTo(10);
          cy.wait(500);
        }
      });

      cy.window().then((win) => {
        const logs = (win as any).__videoEventLogs || [];
        const seekBlockedLogs = logs.filter((l: any) => l.event === 'seek-blocked');
        // No debería estar bloqueado dentro del rango
        expect(seekBlockedLogs.length).to.equal(0, 'Forward seek within range should not be blocked');
      });
    });

    it('should allow backward seek always', () => {
      cy.get('[data-testid="video-start-button"]').click();
      cy.get('[data-testid="question-overlay"]', { timeout: 15000 }).should('be.visible');

      // Cerrar pregunta para pasar el timeline
      cy.get('[data-testid="question-close-button"]').click();
      cy.wait(500);

      // Backward seek
      cy.window().then((win) => {
        const player = (win as any).currentYouTubePlayer;
        if (player && player.seekTo) {
          player.seekTo(3);
          cy.wait(500);
        }
      });

      cy.window().then((win) => {
        const logs = (win as any).__videoEventLogs || [];
        const seekBlockedLogs = logs.filter((l: any) => l.event === 'seek-blocked');
        expect(seekBlockedLogs.length).to.equal(0, 'Backward seek should never be blocked');
      });
    });
  });

  describe('SeekPolicy: replayOnSeekBack = true (por defecto)', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        (win as any).__testSeekPolicy = { allowForwardSeek: false, replayOnSeekBack: true };
      });
    });

    it('should replay question when seeking backward past it', () => {
      cy.get('[data-testid="video-start-button"]').click();
      cy.get('[data-testid="question-overlay"]', { timeout: 15000 }).should('be.visible');

      // Cerrar pregunta
      cy.get('[data-testid="question-close-button"]').click();
      cy.wait(300);

      // Backward seek a antes de Q1
      cy.window().then((win) => {
        const player = (win as any).currentYouTubePlayer;
        if (player && player.seekTo) {
          player.seekTo(3);
          cy.wait(500);
        }
      });

      // Pregunta debe reaparecer
      cy.get('[data-testid="question-overlay"]', { timeout: 5000 }).should('be.visible');
    });

    it('should NOT replay if replayOnSeekBack = false', () => {
      cy.window().then((win) => {
        (win as any).__testSeekPolicy = { allowForwardSeek: false, replayOnSeekBack: false };
      });

      cy.get('[data-testid="video-start-button"]').click();
      cy.get('[data-testid="question-overlay"]', { timeout: 15000 }).should('be.visible');

      // Cerrar pregunta
      cy.get('[data-testid="question-close-button"]').click();
      cy.wait(300);

      // Backward seek
      cy.window().then((win) => {
        const player = (win as any).currentYouTubePlayer;
        if (player && player.seekTo) {
          player.seekTo(3);
          cy.wait(500);
        }
      });

      // Pregunta NO debe reaparecer
      cy.get('[data-testid="question-overlay"]', { timeout: 2000 }).should('not.exist');
    });
  });

  describe('TimelineEngine: Epsilon Matching (±0.25s tolerance - Capa 3)', () => {
    it('should trigger question within epsilon tolerance on forward play', () => {
      cy.get('[data-testid="video-start-button"]').click();

      // Video estará jugando y debería detectar Q1 @ 5s con epsilon
      cy.get('[data-testid="question-overlay"]', { timeout: 15000 }).should('be.visible');

      cy.window().then((win) => {
        const logs = (win as any).__videoEventLogs || [];
        const cueEnterLogs = logs.filter((l: any) => l.event === 'cue-enter');
        expect(cueEnterLogs.length).to.be.greaterThan(0, 'Should detect cue enter');
      });
    });

    it('should not double-trigger same question (nextCueIndex pointer)', () => {
      cy.get('[data-testid="video-start-button"]').click();
      cy.get('[data-testid="question-overlay"]', { timeout: 15000 }).should('be.visible');

      cy.window().then((win) => {
        const logs = (win as any).__videoEventLogs || [];
        const firstCueEnterTime = logs.find((l: any) => l.event === 'cue-enter')?.timestamp;

        cy.wait(2000);

        const secondCueEnterTime = logs.slice(logs.length / 2).find((l: any) => l.event === 'cue-enter')?.timestamp;
        // Should not have duplicate cue-enter for same Q1
        expect(secondCueEnterTime).to.be.undefined;
      });
    });

    it('should handle frame-rate variations with epsilon matching', () => {
      cy.get('[data-testid="video-start-button"]').click();

      // Simular acceso a timeline en diferentes frame rates
      cy.window().then((win) => {
        const engine = (win as any).timelineEngine;
        if (engine) {
          // Simular actualización en 30fps vs 60fps vs 24fps
          const times = [4.95, 5.0, 5.05]; // Todos dentro de epsilon
          const results = times.map((t) => engine.update(t));

          // Solo el primero debería entrar en la Q
          const cueEnters = results.filter((r: any) => r.cueEntered);
          expect(cueEnters.length).to.equal(1, 'Should trigger cue only once despite frame rate variations');
        }
      });
    });
  });

  describe('Complex Seek Scenarios', () => {
    it('should handle forward seek → answer → backward seek → replay sequence', () => {
      cy.get('[data-testid="video-start-button"]').click();
      cy.get('[data-testid="question-overlay"]', { timeout: 15000 }).should('be.visible');

      // Answer Q1
      cy.get('[data-testid="question-option"]').first().click();
      cy.wait(500);

      // Backward seek to replay
      cy.window().then((win) => {
        const player = (win as any).currentYouTubePlayer;
        if (player && player.seekTo) {
          player.seekTo(4);
          cy.wait(500);
        }
      });

      // Should replay Q1
      cy.get('[data-testid="question-overlay"]', { timeout: 5000 }).should('be.visible');

      // Answer again
      cy.get('[data-testid="question-option"]').first().click();
      cy.wait(500);

      cy.window().then((win) => {
        const logs = (win as any).__videoEventLogs || [];
        const responses = logs.filter((l: any) => l.event === 'answer-submitted');
        expect(responses.length).to.equal(2, 'Should have recorded both answer attempts');
      });
    });

    it('should handle rapid seek forward-backward-forward', () => {
      cy.get('[data-testid="video-start-button"]').click();
      cy.wait(1000);

      cy.window().then((win) => {
        const player = (win as any).currentYouTubePlayer;
        if (player && player.seekTo) {
          player.seekTo(20); // Forward - should block
          cy.wait(200);
          player.seekTo(5); // Backward - allowed
          cy.wait(200);
          player.seekTo(30); // Forward again - should block
          cy.wait(200);
        }
      });

      // Should still be functional
      cy.window().then((win) => {
        const errors = (win as any).__videoErrors || [];
        expect(errors.length).to.equal(0, 'Rapid seeks should not cause errors');
      });
    });

    it('should maintain maxUnlockedTime correctly through seek sequence', () => {
      cy.get('[data-testid="video-start-button"]').click();
      cy.get('[data-testid="question-overlay"]', { timeout: 15000 }).should('be.visible');

      // Answer Q1 @ 5s
      cy.get('[data-testid="question-option"]').first().click();
      cy.wait(500);

      // Progress to Q2
      cy.get('[data-testid="question-overlay"]', { timeout: 10000 }).should('be.visible');

      // Seek backward to Q1
      cy.window().then((win) => {
        const player = (win as any).currentYouTubePlayer;
        if (player && player.seekTo) {
          player.seekTo(5);
          cy.wait(500);
        }

        const engine = (win as any).timelineEngine;
        if (engine) {
          const maxTime = engine.getMaxUnlockedTime?.();
          // maxUnlockedTime should reflect progress so far
          expect(maxTime).to.be.greaterThan(10);
        }
      });
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle question at time 0', () => {
      cy.window().then((win) => {
        (win as any).__testQuestions = [
          {
            id: 'q0',
            text: '¿Comenzamos?',
            startTime: 0,
            type: 'SINGLE_CHOICE',
            options: [{ id: 'opt1', text: 'Sí' }],
            correctOptionId: 'opt1',
          },
        ];
      });

      cy.get('[data-testid="video-start-button"]').click();
      cy.get('[data-testid="question-overlay"]', { timeout: 5000 }).should('be.visible');
    });

    it('should handle question near video end', () => {
      cy.window().then((win) => {
        (win as any).__testQuestions = [
          {
            id: 'qend',
            text: '¿Fin del video?',
            startTime: 55,
            type: 'SINGLE_CHOICE',
            options: [{ id: 'opt1', text: 'Sí' }],
            correctOptionId: 'opt1',
          },
        ];
      });

      cy.get('[data-testid="video-start-button"]').click();
      cy.wait(500);

      cy.window().then((win) => {
        const player = (win as any).currentYouTubePlayer;
        if (player && player.seekTo) {
          player.seekTo(54);
        }
      });

      cy.get('[data-testid="question-overlay"]', { timeout: 10000 }).should('be.visible');
    });

    it('should handle back-to-back questions with small interval', () => {
      cy.window().then((win) => {
        (win as any).__testQuestions = [
          MOCK_QUESTIONS[0],
          { ...MOCK_QUESTIONS[1], startTime: 6 }, // Only 1s apart
        ];
      });

      cy.get('[data-testid="video-start-button"]').click();
      cy.get('[data-testid="question-overlay"]', { timeout: 15000 }).should('be.visible');

      // Answer first
      cy.get('[data-testid="question-option"]').first().click();
      cy.wait(500);

      // Second should appear quickly
      cy.get('[data-testid="question-overlay"]', { timeout: 5000 }).should('be.visible');

      cy.window().then((win) => {
        const logs = (win as any).__videoEventLogs || [];
        const cueEnters = logs.filter((l: any) => l.event === 'cue-enter');
        expect(cueEnters.length).to.equal(2, 'Should trigger both questions');
      });
    });
  });
});
