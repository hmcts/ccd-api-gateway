function uploadedDocuments(responseBody) {
  if (!responseBody || typeof responseBody !== 'object') {
    return undefined;
  }

  return responseBody.documents || (responseBody._embedded && responseBody._embedded.documents);
}

function uploadedDocumentPath(responseBody) {
  const documents = uploadedDocuments(responseBody);
  const selfUrl = documents && documents[0] && documents[0]._links
    && documents[0]._links.self && documents[0]._links.self.href;

  return selfUrl ? new URL(selfUrl).pathname : undefined;
}

export { uploadedDocumentPath, uploadedDocuments };
