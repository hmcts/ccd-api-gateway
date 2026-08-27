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

  test('GET /data/caseworkers/:uid/jurisdictions returns AUTOTEST1', async ({ authenticatedApiClient }) => {
    const response = await authenticatedApiClient.get(
      '/data/caseworkers/:uid/jurisdictions',
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

  test('GET /definition_import/api/display/jurisdiction-ui-configs returns configs', async ({ authenticatedApiClient }) => {
    const response = await authenticatedApiClient.get(
      '/definition_import/api/display/jurisdiction-ui-configs',
      {
        query: { ids: 'AUTOTEST1' }
      }
    );

    expect(response.status).toBe(200);
    expect(response.data).toEqual(
      expect.objectContaining({
        configs: expect.arrayContaining([
          expect.objectContaining({
            id: 'AUTOTEST1',
            name: expect.any(String),
            shuttered: expect.any(Boolean)
          })
        ])
      })
    );
  });
});
