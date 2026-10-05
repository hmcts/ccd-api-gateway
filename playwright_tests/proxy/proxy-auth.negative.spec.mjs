import { expect, test } from '../fixtures.mjs';

const protectedProxyScenarios = [
  {
    name: 'address lookup',
    path: '/addresses?postcode=SW1A1AA'
  },
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
  },
  {
    name: 'annotations',
    path: '/em-anno/playwright-test'
  },
  {
    name: 'case print',
    path: '/print/playwright-test'
  },
  {
    name: 'case activity',
    path: '/activity/playwright-test'
  },
  {
    name: 'bulk-scan payments',
    path: '/pay-bulkscan/cases/playwright-test'
  },
  {
    name: 'professional reference data',
    path: '/refdata/playwright-test'
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

  test('GET /print/probateManTypes rejects an authenticated user without a Probate role', async ({ authenticatedApiClient }) => {
    const response = await authenticatedApiClient.get('/print/probateManTypes', {
      throwOnError: false
    });

    expect(response.status).toBe(403);
    expect(response.data).toMatchObject({
      error: 'Unauthorised role',
      status: 403,
      message: 'You are not authorized to access this resource'
    });
  });
});
