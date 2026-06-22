import config from 'config';
import { jwtDecode } from 'jwt-decode';
import fetch from  '../util/fetch.js';
import OTP from 'otp';

const idamS2SUrl = config.get('idam.s2s_url');
const serviceName = config.get('idam.service_name');
const secret = config.get('secrets.ccd.microservicekey-ccd-gw');
const otp = new OTP({ secret });

// TODO Caching should be handled by a singleton service
const cache = {};

const serviceTokenGenerator = () => {
    const currentTime = Math.floor(Date.now() / 1000);

    if (cache[serviceName]
        && currentTime < cache[serviceName].expiresAt) {
      return Promise.resolve(cache[serviceName].token);
    } else {
      const oneTimePassword = otp.totp(Date.now());
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

export default serviceTokenGenerator;
