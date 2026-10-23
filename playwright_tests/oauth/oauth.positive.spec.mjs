import { expect, test } from '../fixtures.mjs';
import { accessTokenCookie, obtainAuthorizationCode } from '../helpers/oauth-flow.mjs';

test.describe('OAuth authorization code @functional', () => {
  test('GET /oauth2 sets a cookie that authenticates a proxy request', async ({ apiClient, request }) => {
    const stateResponse = await apiClient.get('/oauth2/state');
    expect(stateResponse.status).toBe(200);
    const state = stateResponse.data.state;
    expect(state).toMatch(/^[a-f0-9]{64}$/);
    const authorizationCode = await obtainAuthorizationCode(request);
    let accessToken;

    try {
      const response = await apiClient.get('/oauth2', {
        headers: { cookie: `oauth2State=${state}` },
        query: {
          code: authorizationCode,
          state,
          redirect_uri: process.env.IDAM_OAUTH2_REDIRECT_URI
        }
      });

      accessToken = accessTokenCookie(response.headers['set-cookie']);

      expect(response.status).toBe(204);
      expect(response.headers['set-cookie']).toContain('accessToken=');
      expect(response.headers['set-cookie']).toContain('HttpOnly');
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
