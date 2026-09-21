const { defineConfig } = require('@playwright/test');

function resolveBaseUrl() {
  const configuredUrl = process.env.TEST_URL;

  if (!configuredUrl) {
    throw new Error('TEST_URL must be set to the base URL of a deployed CCD API Gateway instance.');
  }

  const url = new URL(configuredUrl);
  return url.toString().replace(/\/$/, '');
}

const outputRoot = process.env.PLAYWRIGHT_OUTPUT_DIR || 'functional-output';

module.exports = defineConfig({
  testDir: './playwright_tests',
  testMatch: '**/*.spec.mjs',
  outputDir: `${outputRoot}/test-results`,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30000,
  expect: {
    timeout: 10000
  },
  reporter: [
    [process.env.CI ? 'dot' : 'list'],
    ['junit', { outputFile: `${outputRoot}/playwright-result.xml` }],
    ['html', { outputFolder: `${outputRoot}/playwright-report`, open: 'never' }]
  ],
  use: {
    baseURL: resolveBaseUrl(),
    extraHTTPHeaders: {
      accept: 'application/json'
    },
    ignoreHTTPSErrors: process.env.PLAYWRIGHT_IGNORE_HTTPS_ERRORS === 'true'
  }
});
