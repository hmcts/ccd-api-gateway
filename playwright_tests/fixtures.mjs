import { ApiClient, buildApiAttachment, createLogger } from '@hmcts/playwright-common';
import { expect, test as base } from '@playwright/test';

const test = base.extend({
  apiClient: async ({ playwright }, use, testInfo) => {
    const apiCalls = [];
    const logger = createLogger({
      serviceName: 'ccd-api-gateway-playwright',
      format: process.env.CI ? 'json' : 'pretty',
      defaultMeta: {
        workerId: testInfo.workerIndex
      }
    });
    const apiClient = new ApiClient({
      baseUrl: process.env.TEST_URL,
      name: 'ccd-api-gateway',
      logger,
      defaultHeaders: {
        accept: 'application/json'
      },
      captureRawBodies: false,
      requestFactory: () => playwright.request.newContext({
        ignoreHTTPSErrors: process.env.PLAYWRIGHT_IGNORE_HTTPS_ERRORS === 'true'
      }),
      onResponse: apiCall => apiCalls.push(apiCall)
    });

    try {
      await use(apiClient);
    } finally {
      await apiClient.dispose();

      for (let index = 0; index < apiCalls.length; index += 1) {
        const attachment = buildApiAttachment(apiCalls[index], { includeRaw: false });
        await testInfo.attach(`${index + 1}-${attachment.name}`, {
          body: attachment.body,
          contentType: attachment.contentType
        });
      }
    }
  }
});

export { expect, test };
