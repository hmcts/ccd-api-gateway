const userRequestAuthorizer = require('./user-request-authorizer');
const { Logger } = require('@hmcts/nodejs-logging');

const logger = Logger.getLogger('authCheckerUserOnlyFilter');

const authCheckerUserOnlyFilter = (req, res, next) => {

  req.authentication = {};

  userRequestAuthorizer
    .authorise(req)
    .then(user => {
      req.authentication.user = user;
      req.headers['user-id'] = user.uid;
      req.headers['user-roles'] = user.roles.join(',');
    })
    .then(() => next())
    .catch(error => {
      if (error.name === 'FetchError') {
        logger.error(error);
        if(isBadGatewayError(error)) {
          next({
            status: 502,
            error: 'Bad Gateway',
            message: error.message
          });
        } else {
          next({
            status: 500,
            error: 'Internal Server Error',
            message: error.message
          });
        } 
      } else {
        logger.warn('Unsuccessful user authentication', error);
        error.status = error.status || 401;
        next(error);
      }
    });
};

const isBadGatewayError = (error) => {
  return error.message.includes("getaddrinfo ENOTFOUND") || 
  error.message.includes("socket hang up") ||
  error.message.includes("getaddrinfo EAI_AGAIN") ||
  error.message.includes("connect ETIMEOUT") ||
  error.message.includes("ECONNRESET") ||
  error.message.includes("ECONNREFUSED");
}

module.exports = authCheckerUserOnlyFilter;
