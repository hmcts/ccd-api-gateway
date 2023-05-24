const config = require('config');
const fetch = require('node-fetch');
const { URL } = require('url');
const { Logger } = require('@hmcts/nodejs-logging');

const logger = Logger.getLogger('accessTokenRequest');

const completeRedirectURI = (uri) => {
  if (uri.startsWith('undefined')){
    throw ERROR_INVALID_REDIRECT_URI;
  } else if (!uri.startsWith('http')) {
    return `https://${uri}`;
  }
  return uri;
};

const ERROR_INVALID_REDIRECT_URI = {
  code: 'INVALID_REDIRECT_URI',
  error: 'Bad Request',
  message: 'Redirect URI cannot start with undefined',
  status: 400
};

function accessTokenRequest(request) {
  const options = {
    method: 'POST',
    headers: {
      'Authorization': 'Basic '
        + Buffer.from(config.get('idam.oauth2.client_id') + ':' + config.get('secrets.ccd.ccd-api-gateway-oauth2-client-secret'))
        .toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };

  const oauthUrl = new URL(config.get('idam.oauth2.token_endpoint'));
  oauthUrl.searchParams.append('code',request.query.code);
  oauthUrl.searchParams.append('redirect_uri',completeRedirectURI(request.query.redirect_uri));
  oauthUrl.searchParams.append('grant_type','authorization_code');

  return fetch(oauthUrl.href, options)
    .then(response => {
      if (response.status !== 200) {
        logger.error('Failed to obtain access token. response status:', response.status);
        logger.error('Failed to obtain access token. message:', response.statusText);
      }
      return response;
    })
    .catch(error => {
      logger.error('Failed to obtain access token due to an error:', error);
      throw error;
    });
}
module.exports = accessTokenRequest;
