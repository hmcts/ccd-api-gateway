const accessTokenRequest = require('./access-token-request');
const hasAnAttribute = require('../util/class-attributes-helper');

const config = require('config');
const COOKIE_ACCESS_TOKEN = 'accessToken';

const oauth2Route = (req, res, next) => {
  accessTokenRequest(req)
    .then(result => {
      if( hasAnAttribute(result,'access_token')) {
        res.cookie(COOKIE_ACCESS_TOKEN, result.access_token,
          {
            maxAge: result.expires_in * 1000,
            httpOnly: true,
            secure: config.get('security.secure_auth_cookie_enabled')
          });
        res.status(204).send();
      } else {
        next({
          status:  500,
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
