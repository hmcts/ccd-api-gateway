import { expect, test } from '../fixtures.mjs';

test.describe('Authenticated proxy access @functional', () => {
  test('GET /aggregated/caseworkers/:uid/jurisdictions returns AUTOTEST1', async ({ authenticatedApiClient }) => {
    const response = await authenticatedApiClient.get(
      '/aggregated/caseworkers/:uid/jurisdictions',
      {
        query: { access: 'read' }
      }
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'AUTOTEST1' })
      ])
    );
  });
});
