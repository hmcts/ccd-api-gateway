import { expect, test } from '../fixtures.mjs';
import { accessTokenCookie, obtainAuthorizationCode } from '../helpers/oauth-flow.mjs';

test.describe('OAuth authorization code @functional', () => {
  test('GET /oauth2 exchanges an authorization code and sets the access-token cookie', async ({ apiClient, request }) => {
    const authorizationCode = await obtainAuthorizationCode(request);
    let accessToken;

    try {
      const response = await apiClient.get('/oauth2', {
        query: {
          code: authorizationCode,
          redirect_uri: process.env.IDAM_OAUTH2_REDIRECT_URI
        }
      });

      accessToken = accessTokenCookie(response.headers['set-cookie']);

      expect(response.status).toBe(204);
      expect(response.headers['set-cookie']).toContain('accessToken=');
      expect(response.headers['set-cookie']).toContain('HttpOnly');
      expect(accessToken).toBeTruthy();
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
