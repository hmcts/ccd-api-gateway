const userResolver = require('./user-resolver');
const userInfoCache = require('../cache/cache-config').userInfoCache;
const jwtUtil = require('../util/jwt');

const getCachedUserDetails = (jwt) => {
  return userInfoCache.get(jwtUtil.getJwt(jwt), 
    () => userResolver.getUserDetails(jwt));
};

exports.getUserDetails = getCachedUserDetails;
