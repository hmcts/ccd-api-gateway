const config = require('config');
const fetch = require('../util/fetch');
const jwtUtil = require('../util/jwt');
const { Logger } = require('@hmcts/nodejs-logging');

const logger = Logger.getLogger('userResolver');

const getUserDetails = (jwt) => {
  const userInfoEndpoint = `${config.get('idam.base_url')}/o/userinfo`;

  logger.info(`[cme-969] [gateway idam] GET ${userInfoEndpoint}`);

  return fetch(userInfoEndpoint, {
    headers: {
      'Authorization': jwtUtil.addBearer(jwt)
    }
  })
  .then(res => {
    logger.info(`[cme-969] [gateway idam response] GET ${userInfoEndpoint} <- ${res.status}`);
    return res;
  })
  .catch(error => {
    if (error && error.status) {
      logger.info(`[cme-969] [gateway idam response] GET ${userInfoEndpoint} <- ${error.status}`);
    }
    throw error;
  })
  .then(res => res.json());
};

exports.getUserDetails = getUserDetails;
