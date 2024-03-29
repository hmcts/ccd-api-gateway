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
        mapFetchErrors(error, res, next);
      } else {
        logger.warn('Unsuccessful user authentication', error);
        error.status = error.status || 401;
        next(error);
      }
    });
};

const isBadGatewayError = (error) => {
  return error.message !== undefined && (error.message.includes('getaddrinfo ENOTFOUND') || 
  error.message.includes('socket hang up') ||
  error.message.includes('getaddrinfo EAI_AGAIN') ||
  error.message.includes('connect ETIMEOUT') ||
  error.message.includes('ECONNRESET') ||
  error.message.includes('ECONNREFUSED'));
};

const mapFetchErrors = (error, res, next) => {
  if (next !== undefined){
    if (isBadGatewayError(error)){
      next({
      error: 'Bad Gateway',
      status: 502,
      message: error.message
      });
    }
    else {
      next({
      error: 'Internal Server Error',
      status: 500,
      message: error.message
      });
    }
  } else {
    if (isBadGatewayError(error)) {
      res.status(502);
      res.json({
        error: 'Bad Gateway',
        status: 502,
        message: error.message
      });
    }
    else {
      res.status(500);
      res.json({
        error: 'Error when connecting to remote server',
        status: 504,
        message: error.message
      });
    }
  }
};

module.exports = {
  authCheckerUserOnlyFilter,
  mapFetchErrors
};
