import userResolver from './user-resolver';
import { userInfoCache } from '../cache/cache-config';
import jwtUtil from '../util/jwt';

const getCachedUserDetails = (jwt) => {
  return userInfoCache.getOrElseUpdate(jwtUtil.removeBearer(jwt),
    () => userResolver.getUserDetails(jwt));
};

export {getCachedUserDetails};
