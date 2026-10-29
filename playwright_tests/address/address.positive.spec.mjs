import { expect, test } from '../fixtures.mjs';

test.describe('Address lookup @functional', () => {
  test('GET /addresses returns matching addresses for a valid postcode', async ({ authenticatedApiClient }) => {
    const response = await authenticatedApiClient.get('/addresses', {
      query: { postcode: 'SW1A1AA' }
    });

    expect(response.status).toBe(200);
    expect(response.data).toEqual(
      expect.objectContaining({
        results: expect.arrayContaining([
          expect.objectContaining({
            DPA: expect.objectContaining({
              POSTCODE: 'SW1A 1AA'
            })
          })
        ])
      })
    );
  });
});
