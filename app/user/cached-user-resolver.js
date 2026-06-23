import {getUserDetails} from "./user-resolver.js"
import {userInfoCache} from '../cache/cache-config.js';
import {removeBearer} from '../util/jwt.js';

const getCachedUserDetails = (jwt) => {
  return userInfoCache.getOrElseUpdate(removeBearer(jwt),
    () => getUserDetails(jwt));
};

export {getCachedUserDetails};
