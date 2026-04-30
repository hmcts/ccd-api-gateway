const config = require('config');
const fetch = require('node-fetch');
const COOKIE_ACCESS_TOKEN = require('./oauth2-route').COOKIE_ACCESS_TOKEN;
const TOKEN_PLACEHOLDER = ':token';
const { userInfoCache } = require('../cache/cache-config');
const { Logger } = require('@hmcts/nodejs-logging');

const logger = Logger.getLogger('logoutRoute');

const logoutRoute = (req, res, next) => {
  const accessToken = req.cookies && req.cookies[COOKIE_ACCESS_TOKEN];

  if (accessToken) {
    const options = {
      method: 'DELETE',
      headers: {
        'Authorization': 'Basic '
        + Buffer.from(config.get('idam.oauth2.client_id') + ':' + config.get('secrets.ccd.ccd-api-gateway-oauth2-client-secret'))
          .toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };
    const logoutEndpointTemplate = config.get('idam.oauth2.logout_endpoint');
    const logoutEndpoint = logoutEndpointTemplate.replace(TOKEN_PLACEHOLDER, accessToken);

    logger.info(`[cme-969] [gateway oauth2] DELETE ${logoutEndpointTemplate}`);

    fetch(logoutEndpoint, options)
      .then(response => {
        logger.info(`[cme-969] [gateway oauth2 response] DELETE ${logoutEndpointTemplate} <- ${response.status}`);
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
