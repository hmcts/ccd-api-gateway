import { expect, test } from '../fixtures.mjs';
import { uploadedDocumentPath, uploadedDocuments } from '../helpers/document-response.mjs';

test.describe('Authenticated document management @functional', () => {
  test('POST /documents uploads and deletes a test document', async ({ authenticatedRequestContext }, testInfo) => {
    const documentName = `ccd-api-gateway-playwright-${Date.now()}.txt`;
    let documentPath;

    try {
      const response = await authenticatedRequestContext.post('/documents', {
        multipart: {
          classification: 'PUBLIC',
          'metadata[jurisdiction]': 'AUTOTEST1',
          'metadata[case_type_id]': 'AUTOTEST1',
          files: {
            name: documentName,
            mimeType: 'text/plain',
            buffer: Buffer.from('CCD API Gateway deployed integration test')
          }
        }
      });
      const responseBody = await response.json();
      const documents = uploadedDocuments(responseBody);
      documentPath = uploadedDocumentPath(responseBody);

      await testInfo.attach('document-upload-response.json', {
        body: JSON.stringify(responseBody, null, 2),
        contentType: 'application/json'
      });

      expect(response.status()).toBe(200);
      expect(documents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            originalDocumentName: documentName,
            classification: 'PUBLIC',
            _links: expect.objectContaining({
              self: expect.objectContaining({
                href: expect.stringMatching(/\/documents\/[0-9a-f-]+$/i)
              })
            })
          })
        ])
      );
    } finally {
      if (documentPath) {
        const deleteResponse = await authenticatedRequestContext.delete(`${documentPath}?permanent=true`);

        await testInfo.attach('document-delete-response.json', {
          body: JSON.stringify({
            path: documentPath,
            permanent: true,
            status: deleteResponse.status()
          }, null, 2),
          contentType: 'application/json'
        });

        expect(deleteResponse.status()).toBe(204);
      }
    }
  });
});
