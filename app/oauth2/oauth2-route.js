const accessTokenRequest = require('./access-token-request');
const config = require('config');
const COOKIE_ACCESS_TOKEN = 'accessToken';

const oauth2Route = (req, res, next) => {
  const expectedState = req.session && req.session.oauthState;
  const rawState = req.query && req.query.state;
  const receivedState = Array.isArray(rawState) ? rawState[0] : rawState;

  if (!expectedState || !receivedState || expectedState !== receivedState) {
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
    return next({
      status: 400,
      error: 'Bad Request',
      message: 'Unable to obtain access token - no OAuth2 code provided'
    });
  }

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
