const otp = require('otp');
const config = require('config');
const jwtDecode = require('jwt-decode');
const fetch = require('../util/fetch');

const idamS2SUrl = config.get('idam.s2s_url');
const serviceName = config.get('idam.service_name');
const secret = config.get('secrets.s2s.microservicekey-ccd-gw');

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

      return fetch(`${idamS2SUrl}/lease`, {method: 'POST', body: JSON.stringify(form), headers})
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
