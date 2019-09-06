const accessTokenRequest = require('./access-token-request');
const config = require('config');
const COOKIE_ACCESS_TOKEN = 'accessToken';

const oauth2Route = (req, res, next) => {
  accessTokenRequest(req)
    .then(result => {
      if ( result.status=== 200) {
        res.cookie(COOKIE_ACCESS_TOKEN, result.json().access_token,
          {
            maxAge: result.json().expires_in * 1000,
            httpOnly: true,
            secure: config.get('security.secure_auth_cookie_enabled')
          });
        res.status(204).send();
      } else {
        next();
      }

    })
    .catch(err => next(err));
};

module.exports = {
  COOKIE_ACCESS_TOKEN,
  oauth2Route
};
