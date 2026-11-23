const accessTokenRequest = require('./access-token-request');
const config = require('config');
const {
  OAUTH_STATE_COOKIE_PREFIX,
  OAUTH_STATE_TTL_MS,
  getOAuthStateCookieName,
  setOAuthState,
  consumeOAuthState
} = require('./oauth-state');
const COOKIE_ACCESS_TOKEN = 'accessToken';
const COOKIE_OAUTH2_STATE = OAUTH_STATE_COOKIE_PREFIX;

const oauth2StateRoute = (req, res) => {
  const state = setOAuthState(req);
  const cookieName = getOAuthStateCookieName(state);

  res.cookie(cookieName, req.cookies[cookieName], {
    maxAge: OAUTH_STATE_TTL_MS,
    httpOnly: true,
    sameSite: 'lax',
    secure: config.get('security.secure_auth_cookie_enabled')
  });

  res.status(200).json({ state });
};

const oauth2Route = (req, res, next) => {
  if (!consumeOAuthState(req, req.query && req.query.state)) {
    next({
      error: 'Invalid OAuth2 state',
      status: 400,
      message: 'Invalid OAuth2 state parameter'
    });
    return;
  }

  res.clearCookie(getOAuthStateCookieName(req.query.state));

  accessTokenRequest(req)
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
  COOKIE_OAUTH2_STATE,
  oauth2StateRoute,
  oauth2Route
};
