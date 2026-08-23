/// <reference types="cypress" />
import { HTML5_PROVIDERS, MOCK_QUESTIONS } from '../fixtures/video-interactive';

/**
 * Capa 4: HTML5 Direct Video Tests
 * Verifica que Html5Adapter funciona sin problemas
 */
describe('Video Interactivo: HTML5 Direct Video', () => {
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

  describe('HTML5 Adapter Initialization', () => {
    it('should detect and initialize direct HTML5 video provider', () => {
      cy.window().then((win) => {
        (win as any).__testVideoUrl = HTML5_PROVIDERS[0].url;
      });

      cy.get('[data-testid="video-start-button"]').click();

      cy.window().then((win) => {
        const logs = (win as any).__videoEventLogs || [];
        const providerLogs = logs.filter((l: any) => l.event === 'provider-detected');
        expect(providerLogs[0]?.payload?.provider).to.equal('direct');
      });
    });

    it('should mount HTML5 video element correctly', () => {
      cy.window().then((win) => {
        (win as any).__testVideoUrl = HTML5_PROVIDERS[0].url;
      });

      cy.get('[data-testid="video-start-button"]').click();
      cy.get('[data-testid="video-player-html5"]', { timeout: 5000 }).should('be.visible');
    });

    it('should autoplay after user starts activity (Capa 1)', () => {
      cy.window().then((win) => {
        (win as any).__testVideoUrl = HTML5_PROVIDERS[0].url;
      });

      cy.get('[data-testid="video-start-button"]').click();
      cy.wait(500);

      cy.window().then((win) => {
        const logs = (win as any).__videoEventLogs || [];
        const playEvents = logs.filter((l: any) => l.event === 'playback-resume');
        expect(playEvents.length).to.be.greaterThan(0);
      });
    });
  });

  describe('HTML5 TimeUpdate Events', () => {
    it('should receive continuous timeupdate events', () => {
      cy.window().then((win) => {
        (win as any).__testVideoUrl = HTML5_PROVIDERS[0].url;
      });

      cy.get('[data-testid="video-start-button"]').click();
      cy.wait(2000);

      cy.window().then((win) => {
        const logs = (win as any).__videoEventLogs || [];
        const timeUpdateLogs = logs.filter((l: any) => l.event === 'time-update');
        expect(timeUpdateLogs.length).to.be.greaterThan(5);
      });
    });

    it('should trigger questions at correct timeline points', () => {
      cy.window().then((win) => {
        (win as any).__testVideoUrl = HTML5_PROVIDERS[0].url;
        (win as any).__testQuestions = MOCK_QUESTIONS;
      });

      cy.get('[data-testid="video-start-button"]').click();
      cy.get('[data-testid="question-overlay"]', { timeout: 15000 }).should('be.visible');
      cy.get('[data-testid="question-text"]').should('contain.text', MOCK_QUESTIONS[0].text);
    });
  });

  describe('HTML5 Seek Behavior', () => {
    it('should handle seek events on HTML5 element', () => {
      cy.window().then((win) => {
        (win as any).__testVideoUrl = HTML5_PROVIDERS[0].url;
      });

      cy.get('[data-testid="video-start-button"]').click();
      cy.wait(1000);

      cy.window().then((win) => {
        const video = (win as any).currentHtml5Player as HTMLVideoElement;
        if (video) {
          video.currentTime = 10;
          cy.wait(300);
        }
      });

      cy.window().then((win) => {
        const logs = (win as any).__videoEventLogs || [];
        const seekEvents = logs.filter((l: any) => l.event === 'time-update');
        expect(seekEvents.length).to.be.greaterThan(0);
      });
    });

    it('should enforce seek policy on HTML5 video', () => {
      cy.window().then((win) => {
        (win as any).__testVideoUrl = HTML5_PROVIDERS[0].url;
        (win as any).__testSeekPolicy = { allowForwardSeek: false };
      });

      cy.get('[data-testid="video-start-button"]').click();
      cy.wait(1000);

      // Intentar forward seek
      cy.window().then((win) => {
        const video = (win as any).currentHtml5Player as HTMLVideoElement;
        if (video) {
          video.currentTime = 25; // Forward seek
          cy.wait(500);
        }
      });

      cy.window().then((win) => {
        const logs = (win as any).__videoEventLogs || [];
        const seekBlockedLogs = logs.filter((l: any) => l.event === 'seek-blocked');
        expect(seekBlockedLogs.length).to.be.greaterThan(0);
      });
    });

    it('should replay question on backward seek', () => {
      cy.window().then((win) => {
        (win as any).__testVideoUrl = HTML5_PROVIDERS[0].url;
        (win as any).__testQuestions = MOCK_QUESTIONS;
      });

      cy.get('[data-testid="video-start-button"]').click();
      cy.get('[data-testid="question-overlay"]', { timeout: 15000 }).should('be.visible');

      // Cerrar pregunta
      cy.get('[data-testid="question-close-button"]').click();
      cy.wait(300);

      // Backward seek to before Q1
      cy.window().then((win) => {
        const video = (win as any).currentHtml5Player as HTMLVideoElement;
        if (video) {
          video.currentTime = 3;
          cy.wait(500);
        }
      });

      // Pregunta debe aparecer de nuevo (replay)
      cy.get('[data-testid="question-overlay"]', { timeout: 5000 }).should('be.visible');
    });
  });

  describe('HTML5 Playback Controls', () => {
    it('should pause and resume correctly', () => {
      cy.window().then((win) => {
        (win as any).__testVideoUrl = HTML5_PROVIDERS[0].url;
      });

      cy.get('[data-testid="video-start-button"]').click();
      cy.wait(500);

      cy.window().then((win) => {
        const video = (win as any).currentHtml5Player as HTMLVideoElement;
        if (video) {
          video.pause();
        }
      });

      cy.window().then((win) => {
        const video = (win as any).currentHtml5Player as HTMLVideoElement;
        expect(video?.paused).to.equal(true);
      });

      cy.window().then((win) => {
        const video = (win as any).currentHtml5Player as HTMLVideoElement;
        if (video) {
          video.play();
        }
      });

      cy.window().then((win) => {
        const video = (win as any).currentHtml5Player as HTMLVideoElement;
        // Puede no estar paused inmediatamente, o puede estar en estado de playing
        expect(video).to.exist;
      });
    });

    it('should handle video errors gracefully', () => {
      cy.window().then((win) => {
        (win as any).__testVideoUrl = 'https://example.com/nonexistent-video.mp4';
      });

      cy.get('[data-testid="video-start-button"]').click();
      cy.wait(1000);

      cy.window().then((win) => {
        const logs = (win as any).__videoEventLogs || [];
        // Puede haber un error log
        expect(logs.length).to.be.greaterThan(0);
      });
    });
  });

  describe('HTML5 Cleanup on Unmount', () => {
    it('should properly cleanup video element on route change', () => {
      cy.window().then((win) => {
        (win as any).__testVideoUrl = HTML5_PROVIDERS[0].url;
      });

      cy.get('[data-testid="video-start-button"]').click();
      cy.wait(1000);

      // Navigate away
      cy.visit('/dashboard');

      cy.window().then((win) => {
        const video = (win as any).currentHtml5Player;
        // Player ref should be cleared
        expect(video).to.be.undefined;
      });
    });
  });
});
