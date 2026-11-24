import { expect, test } from '../fixtures.mjs';

const downstreamHealthScenarios = [
  {
    name: 'case activity',
    path: '/activity/health'
  },
  {
    name: 'case print',
    path: '/print/health'
  },
  {
    name: 'professional reference data',
    path: '/refdata/health'
  }
];

test.describe('Authenticated downstream health @functional', () => {
  downstreamHealthScenarios.forEach(scenario => {
    test(`GET ${scenario.path} reports that ${scenario.name} is up`, async ({ authenticatedApiClient }) => {
      const response = await authenticatedApiClient.get(scenario.path);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.data).toMatchObject({
        status: 'UP'
      });
    });
  });
});
