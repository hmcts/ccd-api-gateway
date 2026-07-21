const config = require('config');
const fetch = require('node-fetch');
const COOKIE_ACCESS_TOKEN = require('./oauth2-route').COOKIE_ACCESS_TOKEN;
const { userInfoCache } = require('../cache/cache-config');

const logoutRoute = (req, res, next) => {
  const accessToken = req.cookies && req.cookies[COOKIE_ACCESS_TOKEN];

  if (accessToken) {
    const options = {
      method: 'GET',
      headers: {
        'Authorization': 'Basic '
        + Buffer.from(config.get('idam.oauth2.client_id') + ':' + config.get('secrets.ccd.ccd-api-gateway-oauth2-client-secret'))
          .toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };
    fetch(config.get('idam.hmcts_access_url') + '/o/endSession?token=' + accessToken, options)
      .then(() => {
        res.clearCookie(COOKIE_ACCESS_TOKEN);
        userInfoCache.del(accessToken);
        res.status(204).send();
      })
      .catch(err => next(err));
  } else {
    next({
      error: 'No auth token',
      status: 400,
      message: 'No auth token to log out'
    });
  }
};

module.exports = {
  logoutRoute
};
