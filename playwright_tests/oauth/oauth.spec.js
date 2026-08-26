const { test, expect } = require('@playwright/test');

test.describe('OAuth endpoints @functional', () => {
  test('GET /oauth2 rejects an invalid redirect URI', async ({ request }) => {
    const response = await request.get('/oauth2', {
      params: {
        code: 'playwright-invalid-code',
        redirect_uri: 'undefined:///oauth2redirect'
      }
    });

    expect(response.status()).toBe(400);
    expect(await response.json()).toMatchObject({
      error: 'Bad Request',
      status: 400,
      message: 'Redirect URI cannot start with undefined'
    });
  });

  test('GET /logout rejects an unauthenticated request', async ({ request }) => {
    const response = await request.get('/logout');

    expect(response.status()).toBe(401);
    expect(await response.json()).toMatchObject({
      error: 'Bearer token missing',
      status: 401,
      message: 'You are not authorized to access this resource'
    });
  });
});
