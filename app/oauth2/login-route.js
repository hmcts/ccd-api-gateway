const config = require('config');
const { randomBytes } = require('crypto');
const { Logger } = require('@hmcts/nodejs-logging');
const { redactUrl } = require('../util/log-safe-url');

const logger = Logger.getLogger('loginRoute');

const loginRoute = (req, res) => {
  const state = randomBytes(32).toString('hex');
  req.session.oauthState = state;

  const redirectUri = encodeURIComponent(`${req.protocol}://${req.get('host')}/oauth2`);
  const authorizationEndpoint = config.get('idam.oauth2.authorization_endpoint');
  const clientId = config.get('idam.oauth2.client_id');
  const authorizationUrl =
    `${authorizationEndpoint}?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${encodeURIComponent(state)}`;

  logger.info(`[cme-969] [gateway oauth2] redirect GET ${redactUrl(authorizationUrl)}`);

  res.redirect(302, authorizationUrl);
};

module.exports = { loginRoute };
