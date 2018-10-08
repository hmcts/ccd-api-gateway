const accessTokenRequest = require('./access-token-request');
const config = require('config');
const COOKIE_ACCESS_TOKEN = 'accessToken';

const oauth2Route = (req, res, next) => {
  accessTokenRequest(req)
    .then(result => {
      res.cookie(COOKIE_ACCESS_TOKEN, result.access_token,
        {
          maxAge: result.expires_in * 1000,
          httpOnly: true,
          secure: config.get('security.secure_auth_cookie_enabled')
        });
      res.status(204).send();
    })
    .catch(err => next(err));
};

module.exports = {
  COOKIE_ACCESS_TOKEN,
  oauth2Route
};
