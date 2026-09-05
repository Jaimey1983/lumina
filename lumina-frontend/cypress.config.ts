import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3001',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    chromeWebSecurity: false, // Allow cross-origin for Vimeo tests
    video: true,
    videoCompression: 32,
    screenshotOnRunFailure: true,
  },
});
