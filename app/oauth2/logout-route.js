const config = require('config');
const fetch = require('node-fetch');
const { Logger } = require('@hmcts/nodejs-logging');
const COOKIE_ACCESS_TOKEN = require('./oauth2-route').COOKIE_ACCESS_TOKEN;
const TOKEN_PLACEHOLDER = ':token';
const { userInfoCache } = require('../cache/cache-config');
const { getBasicAuthHeader, redactAuthorizationHeader } = require('./client-auth');

const logger = Logger.getLogger('logoutRoute');

const logoutRoute = (req, res, next) => {
  const accessToken = req.cookies && req.cookies[COOKIE_ACCESS_TOKEN];

  if (accessToken) {
    const options = {
      method: 'DELETE',
      headers: {
        'Authorization': getBasicAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };
    fetch(config.get('idam.oauth2.logout_endpoint').replace(TOKEN_PLACEHOLDER, accessToken), options)
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
