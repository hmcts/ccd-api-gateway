const userRequestAuthorizer = require('./user-request-authorizer');
const { Logger } = require('@hmcts/nodejs-logging');

const logger = Logger.getLogger('authCheckerUserOnlyFilter');

const authCheckerUserOnlyFilter = (req, res, next) => {
  logger.error("mikes error inside authCheckerUserOnlyFilter");
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
        logger.error("mikes error inside authCheckerUserOnlyFilter FetchError");
        mapFetchErrors(error, res); 
      } else {
        logger.warn('Unsuccessful user authentication', error);
        error.status = error.status || 401;
        next(error);
      }
    });
};

const isBadGatewayError = (error) => {
  logger.error("mikes error inside authCheckerUserOnlyFilter.isBadGatewayError error.name: ".concat(error.name, " status: ", error.status));
  return error.message !== undefined && (error.message.includes("getaddrinfo ENOTFOUND") || 
  error.message.includes("socket hang up") ||
  error.message.includes("getaddrinfo EAI_AGAIN") ||
  error.message.includes("connect ETIMEOUT") ||
  error.message.includes("ECONNRESET") ||
  error.message.includes("ECONNREFUSED"));
}

const mapFetchErrors = (error, res) => {
  if (isBadGatewayError(error)){
    res.status(502);
    res.json({
      error: "Bad Gateway",
      status: 502
    });
  }
  else {
    res.status(500);
    res.json({
      error: 'Error when connecting to remote server test error: '.concat(error) ,
      status: 504
    });
  }
}

module.exports = authCheckerUserOnlyFilter;
// module.exports = mapFetchErrors;
