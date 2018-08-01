const config = require('config');
const fetch = require('../util/fetch');

const getUserDetails = (jwt) => {
  let bearerJwt = jwt.startsWith('Bearer ') ? jwt : 'Bearer ' + jwt;

  return fetch(`${config.get('idam.base_url')}/details`, {
    headers: {
      'Authorization': bearerJwt
    }
  })
  .then(res => res.json());
};

exports.getUserDetails = getUserDetails;
