const accessTokenRequest = require('./access-token-request');
const config = require('config');
const COOKIE_ACCESS_TOKEN = 'accessToken';

const oauth2Route = (req, res, next) => {
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
  oauth2Route
};
