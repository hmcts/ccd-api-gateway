const config = require('config');

/**
 * Builds the Basic Authorization header value for OAuth2 client credentials.
 * Centralises secret access to a single location and validates the secret is present.
 */
const getBasicAuthHeader = () => {
  const clientId = config.get('idam.oauth2.client_id');
  const clientSecret = config.get('secrets.ccd.ccd-api-gateway-oauth2-client-secret');

  if (!clientSecret) {
    throw new Error('OAuth2 client secret not configured');
  }

  return 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
};

module.exports = { getBasicAuthHeader };
