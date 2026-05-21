const config = require('config');

const AUTHORIZATION_HEADER = 'Authorization';
const CLIENT_ID_CONFIG_KEY = 'idam.oauth2.client_id';
const CLIENT_SECRET_CONFIG_KEY = 'secrets.ccd.ccd-api-gateway-oauth2-client-secret';

const missingConfigError = (configKey) => {
  const error = new Error(`Missing required config: ${configKey}`);
  error.status = 500;
  error.code = 'OAUTH2_CLIENT_CONFIG_MISSING';
  return error;
};

const getRequiredConfig = (configKey) => {
  const value = config.get(configKey);

  if (!value) {
    throw missingConfigError(configKey);
  }

  return value;
};

const getBasicAuthHeader = () => {
  const clientId = getRequiredConfig(CLIENT_ID_CONFIG_KEY);
  const clientSecret = getRequiredConfig(CLIENT_SECRET_CONFIG_KEY);

  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
};

const redactAuthorizationHeader = (headers) => {
  const result = Object.assign({}, headers);
  if (result[AUTHORIZATION_HEADER]) {
    result[AUTHORIZATION_HEADER] = 'Basic [REDACTED]';
  }
  if (result[AUTHORIZATION_HEADER.toLowerCase()]) {
    result[AUTHORIZATION_HEADER.toLowerCase()] = 'Basic [REDACTED]';
  }
  return result;
};

module.exports = {
  getBasicAuthHeader,
  redactAuthorizationHeader
};