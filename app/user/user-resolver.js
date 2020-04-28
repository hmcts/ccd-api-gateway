const config = require('config');
const fetch = require('../util/fetch');
const jwtUtil = require('../util/jwt');

const getUserDetails = (jwt) => {
  let bearerJwt = jwtUtil.getBearerJwt(jwt);
  return fetch(`${config.get('idam.base_url')}/o/userinfo`, {
    headers: {
      'Authorization': bearerJwt
    }
  })
  .then(res => res.json());
};

exports.getUserDetails = getUserDetails;
