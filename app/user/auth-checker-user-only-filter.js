const { safeError, diagnosticError } = require('../safe-errors');
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
        mapFetchErrors(error, res, next);
      } else {
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
  const body = safeError(isBadGatewayError(error) ? 502 : 500, error);
  if (next !== undefined) {
    next(body);
  } else {
    logger.error(`Proxy request failed: code=${body.code} status=${body.status}`, { error: diagnosticError(error) });
    res.status(body.status);
    res.json(body);
  }
};

module.exports = {
  authCheckerUserOnlyFilter,
  mapFetchErrors
};
