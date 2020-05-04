const BEARER_PREFIX = 'Bearer ';

const addBearer = (jwt) => {
  return jwt.startsWith(BEARER_PREFIX) ? jwt : BEARER_PREFIX + jwt;
};

const removeBearer = (jwt) => {
  return jwt.startsWith(BEARER_PREFIX) ? jwt.replace(BEARER_PREFIX, '') : jwt;
};

exports.addBearer = addBearer;
exports.removeBearer = removeBearer;
