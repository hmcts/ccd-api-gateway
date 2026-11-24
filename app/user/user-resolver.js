const config = require('config');
const fetch = require('../util/fetch');
const jwtUtil = require('../util/jwt');

const getUserDetails = (jwt) => {
  return fetch(`${config.get('idam.web_public_url')}/o/userinfo`, {
    headers: {
      'Authorization': jwtUtil.addBearer(jwt)
    }
  })
  .then(res => res.json());
};

exports.getUserDetails = getUserDetails;
