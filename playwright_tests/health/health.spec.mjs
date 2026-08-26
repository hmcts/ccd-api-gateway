import { expect, test } from '../fixtures.mjs';

test.describe('Gateway health @smoke', () => {
  test('GET /health reports that the deployed gateway is up', async ({ apiClient }) => {
    const response = await apiClient.get('/health');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.data).toMatchObject({
      status: 'UP'
    });
  });
});

test.describe('Gateway readiness @functional', () => {
  test('GET /health/readiness reports that the deployed gateway is ready', async ({ apiClient }) => {
    const response = await apiClient.get('/health/readiness');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.data).toMatchObject({
      status: 'UP'
    });
  });

  test('GET /health/liveness reports that the deployed gateway is live', async ({ apiClient }) => {
    const response = await apiClient.get('/health/liveness');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.data).toMatchObject({
      status: 'UP'
    });
  });
});
