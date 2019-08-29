const { Logger } = require('@hmcts/nodejs-logging');
const logger = Logger.getLogger('user-request-authorizer');
const userResolver = require('./user-resolver');
const authorizedRolesExtractor = require('./authorised-roles-extractor');
const COOKIE_ACCESS_TOKEN = require('../oauth2/oauth2-route').COOKIE_ACCESS_TOKEN;

const AUTHORIZATION = 'Authorization';
const ERROR_TOKEN_MISSING = {
  error: 'Bearer token missing',
  status: 401,
  message: 'You are not authorized to access this resource'
};
const ERROR_UNAUTHORISED_ROLE = {
  error: 'Unauthorised role',
  status: 403,
  message: 'You are not authorized to access this resource'
};
const ERROR_UNAUTHORISED_USER_ID = {
  error: 'Unauthorised user',
  status: 403,
  message: 'You are not authorized to access this resource'
};
const USER_ID_PLACEHOLDER = ':uid';

const authorise = (request) => {
  let user;
  let bearerToken = request.get(AUTHORIZATION) || (request.cookies ? request.cookies[COOKIE_ACCESS_TOKEN] : null);

  logger.info('*****************************');
  logger.info('AUTHORIZATION=', AUTHORIZATION);
  logger.info('COOKIE_ACCESS_TOKEN=', COOKIE_ACCESS_TOKEN);
  logger.info('*****************************');
  logger.info('request=', request);
  logger.info('*****************************');
  logger.info('bearerToken=', bearerToken);
  logger.info('*****************************');

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

  return userResolver
    .getUserDetails(bearerToken)
    .then(userDetails => user = userDetails)
    .then(() => fillInUserId(request, user))
    .then(() => authorizeRoles(request, user))
    .then(() => user);
};

const authorizeRoles = (request, user) => {
  return new Promise((resolve, reject) => {
    if (request.originalUrl.includes('caseworkers')) {
      let roles = authorizedRolesExtractor.extract(request);

      if (roles
        && roles.length
        && !roles.some(role => user.roles.includes(role))) {
        reject(ERROR_UNAUTHORISED_ROLE);
      } else {
        resolve();
      }
    } else {
      // Don't attempt to check the roles, since the URL doesn't match the expected pattern
      resolve();
    }
  });
};

const fillInUserId = (request, user) => {
  request.url = request.url.replace(USER_ID_PLACEHOLDER, user.id);
  request.originalUrl = request.originalUrl.replace(USER_ID_PLACEHOLDER, user.id);
};

exports.ERROR_TOKEN_MISSING = ERROR_TOKEN_MISSING;
exports.ERROR_UNAUTHORISED_ROLE = ERROR_UNAUTHORISED_ROLE;
exports.ERROR_UNAUTHORISED_USER_ID = ERROR_UNAUTHORISED_USER_ID;
exports.AUTHORIZATION = AUTHORIZATION;
exports.authorise = authorise;
