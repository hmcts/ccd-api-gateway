const userResolver = require('./user-resolver');
const { userInfoCache } = require('../cache/cache-config');
const jwtUtil = require('../util/jwt');

const getCachedUserDetails = (jwt) => {
  return userInfoCache.getOrElseUpdate(jwtUtil.removeBearer(jwt), 
    () => userResolver.getUserDetails(jwt));
};

exports.getUserDetails = getCachedUserDetails;
