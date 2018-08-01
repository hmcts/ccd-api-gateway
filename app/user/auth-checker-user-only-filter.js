const userRequestAuthorizer = require('./user-request-authorizer');
const { Logger } = require('@hmcts/nodejs-logging');

const logger = Logger.getLogger('authCheckerUserOnlyFilter');

const authCheckerUserOnlyFilter = (req, res, next) => {

  req.authentication = {};

  userRequestAuthorizer
    .authorise(req)
    .then(user => {
      req.authentication.user = user;
      req.headers['user-id'] = user.id;
      req.headers['user-roles'] = user.roles.join(',');
    })
    .then(() => next())
    .catch(error => {
      if (error.name === 'FetchError') {
        logger.error(error);
        next({
          status: 500,
          error: 'Internal Server Error',
          message: error.message
        });
      } else {
        logger.warn('Unsuccessful user authentication', error);
        error.status = error.status || 401;
        next(error);
      }
    });
};

module.exports = authCheckerUserOnlyFilter;
