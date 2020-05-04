const CacheService = require('./cache-service');
const config = require('config');

// TTL for userInfoCache should always be set to lower value than the actual token's TTL
// to limit risk/time of an expired token still returning details - config default is 10 mins
const userInfoCache = new CacheService('UserInfoCache', config.get('cache.user_info_ttl'), config.get('cache.user_info_check_period'));

module.exports = { 
  userInfoCache 
};
