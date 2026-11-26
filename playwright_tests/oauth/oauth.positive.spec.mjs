import { expect, test } from '../fixtures.mjs';
import { accessTokenCookie, completeBrowserAuthorization } from '../helpers/oauth-flow.mjs';

test.describe('OAuth authorization code @functional', () => {
  test('GET /oauth2 sets a cookie that authenticates a proxy request', async ({ apiClient, page, context }) => {
    test.setTimeout(60000);
    expect(new URL(process.env.TEST_URL).protocol).toBe('https:');
    const stateResponse = await page.goto('/oauth2/state');
    expect(stateResponse.status()).toBe(200);
    const { state } = await stateResponse.json();
    expect(state).toMatch(/^[a-f0-9]{64}$/);
    const stateCookies = (await context.cookies(process.env.TEST_URL))
      .filter(cookie => cookie.name.startsWith('oauth2State'));
    expect(stateCookies).toHaveLength(1);
    expect(stateCookies[0]).toMatchObject({ secure: true, httpOnly: true, sameSite: 'Lax' });
    let accessToken;

    try {
      const { response, returnedState } = await completeBrowserAuthorization(page, state);
      expect(returnedState).toBe(state);
      const headers = await response.allHeaders();

      accessToken = accessTokenCookie(headers['set-cookie']);

      expect(response.status()).toBe(204);
      expect(headers['set-cookie']).toContain('accessToken=');
      expect(headers['set-cookie']).toContain('HttpOnly');
      expect(accessToken).toBeTruthy();

      const proxyResponse = await apiClient.get(
        '/aggregated/caseworkers/:uid/jurisdictions',
        {
          headers: {
            cookie: `accessToken=${accessToken}`,
            'content-type': 'application/json'
          },
          query: { access: 'read' }
        }
      );

      expect(proxyResponse.status).toBe(200);
      expect(proxyResponse.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'AUTOTEST1' })
        ])
      );
    } finally {
      if (accessToken) {
        const logoutResponse = await apiClient.get('/logout', {
          headers: {
            cookie: `accessToken=${accessToken}`
          }
        });

        expect(logoutResponse.status).toBe(204);
      }
    }
  });
});
