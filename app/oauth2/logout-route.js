const config = require('config');
const fetch = require('node-fetch').default;
const { Logger } = require('@hmcts/nodejs-logging');
const COOKIE_ACCESS_TOKEN = require('./oauth2-route').COOKIE_ACCESS_TOKEN;
const { userInfoCache } = require('../cache/cache-config');
const { getBasicAuthHeader, redactAuthorizationHeader } = require('./client-auth');

const logger = Logger.getLogger('logoutRoute');

const logoutRoute = (req, res, next) => {
  const accessToken = req.cookies && req.cookies[COOKIE_ACCESS_TOKEN];

  if (accessToken) {
    const options = {
      method: 'GET',
      headers: {
        'Authorization': getBasicAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };
    fetch(config.get('idam.web_public_url') + '/o/endSession?token=' + accessToken, options)
      .then(() => {
        res.clearCookie(COOKIE_ACCESS_TOKEN);
        userInfoCache.del(accessToken);
        res.status(204).send();
      })
      .catch(err => {
        logger.error('Failed to logout due to an error:', err);
        logger.error('Request headers:', redactAuthorizationHeader(options.headers));
        next(err);
      });
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
