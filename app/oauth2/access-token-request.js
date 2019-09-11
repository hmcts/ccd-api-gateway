const config = require('config');
const fetch = require('node-fetch');
const url = require('url');
const { Logger } = require('@hmcts/nodejs-logging');

const logger = Logger.getLogger('accessTokenRequest');

const completeRedirectURI = (uri) => {
  if (!uri.startsWith('http')) {
    return `https://${uri}`;
  }
  return uri;
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
  const params = {
    code: request.query.code,
    redirect_uri: completeRedirectURI(request.query.redirect_uri),
    grant_type: 'authorization_code'
  };
  return fetch(config.get('idam.oauth2.token_endpoint') + url.format({ query: params }), options)
    .then(response => produceResponse(response))
    .catch(error => {
      logger.error('Failed to obtain access token due an error:', error);
      throw error;
    });
}

function produceResponse(response){

  switch(response.status) {
    case 200:
      return response.json();
    default:
      return response;
  }
}

module.exports = accessTokenRequest;
