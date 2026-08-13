const accessTokenRequest = require('./access-token-request');
const config = require('config');
const { randomBytes } = require('crypto');
const COOKIE_ACCESS_TOKEN = 'accessToken';
const COOKIE_OAUTH2_STATE = 'oauth2State';
const STATE_COOKIE_MAX_AGE_MS = 5 * 60 * 1000;

const oauth2StateRoute = (req, res) => {
  const state = randomBytes(32).toString('hex');

  res.cookie(COOKIE_OAUTH2_STATE, state, {
    maxAge: STATE_COOKIE_MAX_AGE_MS,
    httpOnly: true,
    sameSite: 'lax',
    secure: config.get('security.secure_auth_cookie_enabled')
  });

  res.status(200).json({ state });
};

const getStateValidationError = (req) => {
  const requestState = req.query ? req.query.state : undefined;
  const cookieState = req.cookies ? req.cookies[COOKIE_OAUTH2_STATE] : undefined;

  if (!requestState || !cookieState || requestState !== cookieState) {
    return {
      error: 'Invalid OAuth2 state',
      status: 400,
      message: 'Invalid OAuth2 state parameter'
    };
  }

  return null;
};

const oauth2Route = (req, res, next) => {
  const stateValidationError = getStateValidationError(req);

  if (stateValidationError) {
    next(stateValidationError);
    return;
  }

  res.clearCookie(COOKIE_OAUTH2_STATE);

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
