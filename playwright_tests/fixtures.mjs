import { ApiClient, IdamUtils, buildApiAttachment, createLogger } from '@hmcts/playwright-common';
import { expect, test as base } from '@playwright/test';

const requiredAuthenticationVariables = [
  'IDAM_WEB_URL',
  'IDAM_TESTING_SUPPORT_URL',
  'CCD_CASEWORKER_AUTOTEST_EMAIL',
  'CCD_CASEWORKER_AUTOTEST_PASSWORD',
  'CCD_API_GATEWAY_OAUTH2_CLIENT_SECRET'
];

function requireAuthenticationEnvironment() {
  const missing = requiredAuthenticationVariables.filter(name => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(`Authenticated deployed tests require: ${missing.join(', ')}`);
  }
}

function createTestLogger(testInfo) {
  return createLogger({
    serviceName: 'ccd-api-gateway-playwright',
    format: process.env.CI ? 'json' : 'pretty',
    defaultMeta: {
      workerId: testInfo.workerIndex
    }
  });
}

async function generateIdamAccessToken(browserName) {
  requireAuthenticationEnvironment();

  const idamUtils = new IdamUtils({
    logger: createLogger({
      serviceName: 'ccd-api-gateway-playwright-idam',
      format: process.env.CI ? 'json' : 'pretty',
      defaultMeta: { browserName }
    })
  });

  try {
    return await idamUtils.generateIdamToken({
      grantType: 'password',
      clientId: process.env.IDAM_OAUTH2_CLIENT_ID || 'ccd_gateway',
      clientSecret: process.env.CCD_API_GATEWAY_OAUTH2_CLIENT_SECRET,
      scope: process.env.IDAM_OAUTH2_SCOPE || 'openid profile roles',
      username: process.env.CCD_CASEWORKER_AUTOTEST_EMAIL,
      password: process.env.CCD_CASEWORKER_AUTOTEST_PASSWORD,
      redirectUri: process.env.IDAM_OAUTH2_REDIRECT_URI
    });
  } finally {
    await idamUtils.dispose();
  }
}

async function useApiClient({ playwright, use, testInfo, defaultHeaders = {} }) {
  const apiCalls = [];
  const apiClient = new ApiClient({
    baseUrl: process.env.TEST_URL,
    name: 'ccd-api-gateway',
    logger: createTestLogger(testInfo),
    defaultHeaders: Object.assign({
      accept: 'application/json'
    }, defaultHeaders),
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

const test = base.extend({
  apiClient: async ({ playwright }, use, testInfo) => {
    await useApiClient({ playwright, use, testInfo });
  },
  idamAccessToken: [async ({ browserName }, use) => {
    await use(await generateIdamAccessToken(browserName));
  }, { scope: 'worker' }],
  freshIdamAccessToken: async ({ browserName }, use) => {
    await use(await generateIdamAccessToken(browserName));
  },
  authenticatedRequestContext: async ({ idamAccessToken, playwright }, use) => {
    const requestContext = await playwright.request.newContext({
      baseURL: process.env.TEST_URL,
      ignoreHTTPSErrors: process.env.PLAYWRIGHT_IGNORE_HTTPS_ERRORS === 'true',
      extraHTTPHeaders: {
        accept: 'application/json',
        Authorization: `Bearer ${idamAccessToken}`
      }
    });

    try {
      await use(requestContext);
    } finally {
      await requestContext.dispose();
    }
  },
  authenticatedApiClient: async ({ idamAccessToken, playwright }, use, testInfo) => {
    await useApiClient({
      playwright,
      use,
      testInfo,
      defaultHeaders: {
        Authorization: `Bearer ${idamAccessToken}`,
        'content-type': 'application/json'
      }
    });
  }
});

export { expect, test };
