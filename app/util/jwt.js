const BEARER_PREFIX = 'Bearer ';

const getBearerJwt = (jwt) => {
  return jwt.startsWith(BEARER_PREFIX) ? jwt : BEARER_PREFIX + jwt;
};

const getJwt = (jwt) => {
  return jwt.startsWith(BEARER_PREFIX) ? jwt.replace(BEARER_PREFIX, '') : jwt;
};

exports.getBearerJwt = getBearerJwt;
exports.getJwt = getJwt;
