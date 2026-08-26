const { test, expect } = require('@playwright/test');

test.describe('Gateway health @smoke', () => {
  test('GET /health reports that the deployed gateway is up', async ({ request }) => {
    const response = await request.get('/health');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    expect(await response.json()).toMatchObject({
      status: 'UP'
    });
  });
});

test.describe('Gateway readiness @functional', () => {
  test('GET /health/readiness reports that the deployed gateway is ready', async ({ request }) => {
    const response = await request.get('/health/readiness');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    expect(await response.json()).toMatchObject({
      status: 'UP'
    });
  });
});
