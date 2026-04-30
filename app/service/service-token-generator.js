const otp = require('otp');
const config = require('config');
const jwtDecode = require('jwt-decode');
const fetch = require('../util/fetch');
const { Logger } = require('@hmcts/nodejs-logging');

const idamS2SUrl = config.get('idam.s2s_url');
const serviceName = config.get('idam.service_name');
const secret = config.get('secrets.ccd.microservicekey-ccd-gw');
const logger = Logger.getLogger('serviceTokenGenerator');

// TODO Caching should be handled by a singleton service
const cache = {};

const serviceTokenGenerator = () => {
    const currentTime = Math.floor(Date.now() / 1000);

    if (cache[serviceName]
        && currentTime < cache[serviceName].expiresAt) {
      return Promise.resolve(cache[serviceName].token);
    } else {
      const oneTimePassword = otp({secret: secret}).totp();
      const form = {
        microservice: serviceName,
        oneTimePassword
      };
      const headers = {
        'Content-Type': 'application/json'
      };
      const leaseEndpoint = `${idamS2SUrl}/lease`;

      logger.info(`[cme-969] [gateway s2s] POST ${leaseEndpoint}`);

      return fetch(leaseEndpoint, {method: 'POST', body: JSON.stringify(form), headers})
          .then(res => {
            logger.info(`[cme-969] [gateway s2s response] POST ${leaseEndpoint} <- ${res.status}`);
            return res;
          })
          .catch(error => {
            if (error && error.status) {
              logger.info(`[cme-969] [gateway s2s response] POST ${leaseEndpoint} <- ${error.status}`);
            }
            throw error;
          })
          .then(res => res.text())
          .then(token => {
            let tokenData = jwtDecode(token);

            cache[serviceName] = {
              expiresAt: tokenData.exp,
              token: token
            };

            return token;
          });
    }
};

module.exports = serviceTokenGenerator;
