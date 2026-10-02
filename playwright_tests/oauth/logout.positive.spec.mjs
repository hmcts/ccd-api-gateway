import { expect, test } from '../fixtures.mjs';

test.describe('OAuth logout @functional', () => {
  test('GET /logout invalidates an authenticated session', async ({ apiClient, freshIdamAccessToken }) => {
    const response = await apiClient.get('/logout', {
      headers: {
        cookie: `accessToken=${freshIdamAccessToken}`
      }
    });

    expect(response.status).toBe(204);
    expect(response.headers['set-cookie']).toContain('accessToken=;');
  });
});
