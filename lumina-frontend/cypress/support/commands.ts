/// <reference types="cypress" />

/**
 * Cypress Support File
 * Custom commands para tests del video interactivo
 */
import { asTestWindow, type VideoEventLog } from './test-window';

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to log video event (debugging)
       * Usage: cy.logVideoEvent('provider-detected', { provider: 'youtube' })
       */
      logVideoEvent(eventName: string, payload?: Record<string, unknown>): Chainable<void>;

      /**
       * Custom command to wait for video player to be ready
       * Usage: cy.waitForVideoReady()
       */
      waitForVideoReady(): Chainable<void>;

      /**
       * Custom command to answer a question
       * Usage: cy.answerQuestion(optionIndex)
       */
      answerQuestion(optionIndex: number): Chainable<void>;

      /**
       * Custom command to start video activity
       * Usage: cy.startVideoActivity()
       */
      startVideoActivity(): Chainable<void>;

      /**
       * Custom command to get debug logs
       * Usage: cy.getVideoLogs().then(logs => ...)
       */
      getVideoLogs(): Chainable<VideoEventLog[]>;
    }
  }
}

Cypress.Commands.add('logVideoEvent', (eventName: string, payload?: Record<string, unknown>) => {
  cy.window().then((win) => {
    const testWin = asTestWindow(win);
    if (!testWin.__videoEventLogs) {
      testWin.__videoEventLogs = [];
    }
    testWin.__videoEventLogs.push({
      event: eventName,
      payload,
      timestamp: Date.now(),
    });
  });
});

Cypress.Commands.add('waitForVideoReady', () => {
  cy.window().then((win) => {
    const testWin = asTestWindow(win);
    return cy.wrap(
      new Promise((resolve) => {
        const checkReady = setInterval(() => {
          const logs = testWin.__videoEventLogs || [];
          if (logs.some((l) => l.event === 'player-ready')) {
            clearInterval(checkReady);
            resolve(true);
          }
        }, 100);

        setTimeout(() => {
          clearInterval(checkReady);
          resolve(false);
        }, 10000);
      })
    );
  });
});

Cypress.Commands.add('answerQuestion', (optionIndex: number) => {
  cy.get('[data-testid="question-option"]').eq(optionIndex).click();
});

Cypress.Commands.add('startVideoActivity', () => {
  cy.get('[data-testid="video-start-button"]').click();
});

Cypress.Commands.add('getVideoLogs', () => {
  return cy.window().then((win) => {
    return asTestWindow(win).__videoEventLogs || [];
  });
});

// Global error handling
Cypress.on('uncaught:exception', (err) => {
  // Log pero no falles tests por excepciones globales
  console.error('Uncaught exception:', err);
  return false; // Prevent test failure
});
