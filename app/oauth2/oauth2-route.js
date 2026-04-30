const accessTokenRequest = require('./access-token-request');
const config = require('config');
const { Logger } = require('@hmcts/nodejs-logging');
const COOKIE_ACCESS_TOKEN = 'accessToken';
const logger = Logger.getLogger('oauth2Route');

const oauth2Route = (req, res, next) => {
  logger.info('[cme-969] [gateway oauth2] handling OAuth2 callback');
  const expectedState = req.session && req.session.oauthState;
  const rawState = req.query && req.query.state;
  const receivedState = Array.isArray(rawState) ? rawState[0] : rawState;

  if (!expectedState || !receivedState || expectedState !== receivedState) {
    logger.warn('[cme-969] [gateway oauth2] invalid state parameter');
    if (req.session) {
      delete req.session.oauthState;
    }
    return next({
      status: 400,
      error: 'Bad Request',
      message: 'Invalid state parameter - possible CSRF attack'
    });
  }

  delete req.session.oauthState;

  if (!req.query.code) {
    logger.warn('[cme-969] [gateway oauth2] missing OAuth2 code');
    return next({
      status: 400,
      error: 'Bad Request',
      message: 'Unable to obtain access token - no OAuth2 code provided'
    });
  }

  logger.info('[cme-969] [gateway oauth2] exchanging OAuth2 authorization code');
  return accessTokenRequest(req)
    .then(result => {
      if( result.status === 200 ) {

        result.json().then ( jsonResult => {

          res.cookie(COOKIE_ACCESS_TOKEN, jsonResult.access_token,
            {
              maxAge: jsonResult.expires_in * 1000,
              httpOnly: true,
              secure: config.get('security.secure_auth_cookie_enabled')
            });
          res.status(204).send();
          }
        );
      } else {
        next({
          status:  502,
          message: 'Internal Server Error'
        });
      }

    })
    .catch(err => next(err));
};

module.exports = {
  COOKIE_ACCESS_TOKEN,
  oauth2Route
};
