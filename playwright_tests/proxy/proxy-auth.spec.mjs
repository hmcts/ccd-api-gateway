import { expect, test } from '../fixtures.mjs';

const protectedProxyScenarios = [
  {
    name: 'aggregated',
    path: '/aggregated/playwright-test'
  },
  {
    name: 'data',
    path: '/data/playwright-test'
  },
  {
    name: 'definition import',
    path: '/definition_import/playwright-test'
  },
  {
    name: 'documents',
    path: '/documents/playwright-test'
  },
  {
    name: 'payments',
    path: '/payments/card-payments/playwright-test'
  }
];

test.describe('Proxy authentication @functional', () => {
  protectedProxyScenarios.forEach(proxyScenario => {
    test(`GET ${proxyScenario.path} rejects an unauthenticated ${proxyScenario.name} request`, async ({ apiClient }) => {
      const response = await apiClient.get(proxyScenario.path, {
        throwOnError: false
      });

      expect(response.status).toBe(401);
      expect(response.data).toMatchObject({
        error: 'Bearer token missing',
        status: 401,
        message: 'You are not authorized to access this resource'
      });
    });
  });
});
