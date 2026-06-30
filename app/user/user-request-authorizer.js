import extract from './authorised-roles-extractor.js';
import {COOKIE_ACCESS_TOKEN} from '../oauth2/oauth2-route.js';
import config from 'config';

const userResolver = config.get('cache.user_info_enabled')
  ? await import('./cached-user-resolver.js')
  : await import('./user-resolver.js');

const getUserDetails = userResolver.getUserDetails
  || userResolver.default?.getUserDetails;

const AUTHORIZATION = 'Authorization';

const ERROR_TOKEN_MISSING = {
  error: 'Bearer token missing',
  status: 401,
  message: 'You are not authorized to access this resource'
};

class UnauthorisedRoleError extends Error {
  constructor() {
    super('You are not authorized to access this resource');
    this.error = 'Unauthorised role';
    this.status = 403;
  }
}

const ERROR_UNAUTHORISED_ROLE = new UnauthorisedRoleError();

const ERROR_UNAUTHORISED_USER_ID = {
  error: 'Unauthorised user',
  status: 403,
  message: 'You are not authorized to access this resource'
};

const USER_ID_PLACEHOLDER = ':uid';

const STATIC_ROLE_PROTECTED_PATHS = [
  {
    pathPrefix: '/print/probateManTypes',
    requiredRoles: ['caseworker-probate', 'caseworker-probate-issuer']
  }
];

const authorise = (request) => {
  let user;
  let bearerToken = request.get(AUTHORIZATION) ||
    (request.cookies ? request.cookies[COOKIE_ACCESS_TOKEN] : null);

  if (!bearerToken) {
    return Promise.reject(ERROR_TOKEN_MISSING);
  }

  // Use AccessToken cookie as Authorization header
  if (!request.get(AUTHORIZATION) && bearerToken) {
    if (!request.headers) {
      request.headers = {[AUTHORIZATION]: `Bearer ${bearerToken}`};
    } else {
      request.headers[AUTHORIZATION] = `Bearer ${bearerToken}`;
    }
  }

  return getUserDetails(bearerToken)
    .then(userDetails => user = userDetails)
    .then(() => fillInUserId(request, user))
    .then(() => authorizeRoles(request, user))
    .then(() => user);
};

const authorizeRoles = (request, user) => {
  if (request.originalUrl.includes('/caseworkers/')) {
    const roles = extract(request);

    if (roles.length === 0 ||
      !roles.some(role => user.roles.includes(role))) {
      return Promise.reject(ERROR_UNAUTHORISED_ROLE);
    }

    return Promise.resolve();
  }

  const matchedStaticPath = STATIC_ROLE_PROTECTED_PATHS.find(config =>
    request.originalUrl.startsWith(config.pathPrefix)
  );

  if (matchedStaticPath) {
    const hasRequiredRole = matchedStaticPath.requiredRoles
      .some(role => user.roles.includes(role));

    if (!hasRequiredRole) {
      return Promise.reject(ERROR_UNAUTHORISED_ROLE);
    }
  }

  return Promise.resolve();
};

const fillInUserId = (request, user) => {
  request.url = request.url.replace(USER_ID_PLACEHOLDER, user.uid);
  request.originalUrl = request.originalUrl.replace(USER_ID_PLACEHOLDER, user.uid);
};

export {
  ERROR_TOKEN_MISSING,
  ERROR_UNAUTHORISED_ROLE,
  ERROR_UNAUTHORISED_USER_ID,
  AUTHORIZATION,
  authorise
};
