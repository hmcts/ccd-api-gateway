const config = require('config');
const fetch = require('../util/fetch');
const jwtUtil = require('../util/jwt');
const { Logger } = require('@hmcts/nodejs-logging');
const logger = Logger.getLogger('userResolver');

const getUserDetails = (jwt) => {
  logger.error('getUserDetails inside 2');
  return fetch(`${config.get('idam.base_url')}/o/userinfo`, {
    headers: {
      'Authorization': jwtUtil.addBearer(jwt)
    }
  })
  .then(res => res.json())
  // .finally(res => logger.error('getUserDetails res: ', res, ' res.json: ', res.json()));
  .finally(res => logger.error('getUserDetails res: ', res.json()));
  // .finally(res => logger.error('getUserDetails finally'));
};

exports.getUserDetails = getUserDetails;
