import { expect, test } from '../fixtures.mjs';

test.describe('OAuth endpoints @functional', () => {
  test('GET /oauth2 rejects an invalid redirect URI', async ({ apiClient }) => {
    const stateResponse = await apiClient.get('/oauth2/state');
    expect(stateResponse.status).toBe(200);
    const state = stateResponse.data.state;
    expect(state).toMatch(/^[a-f0-9]{64}$/);

    const response = await apiClient.get('/oauth2', {
      headers: { cookie: `oauth2State=${state}` },
      query: {
        code: 'playwright-invalid-code',
        state,
        redirect_uri: 'undefined:///oauth2redirect'
      },
      throwOnError: false
    });

    expect(response.status).toBe(400);
    expect(response.data).toMatchObject({
      error: 'Bad Request',
      status: 400,
      message: 'Redirect URI cannot start with undefined'
    });
  });

  test('GET /logout rejects an unauthenticated request', async ({ apiClient }) => {
    const response = await apiClient.get('/logout', {
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
