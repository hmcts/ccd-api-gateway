const userRequestAuthorizer = require('./user-request-authorizer');

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
      console.warn('Unsuccessful user authentication', error);
      error.status = error.status || 401;
      next(error);
    });
};

module.exports = authCheckerUserOnlyFilter;
