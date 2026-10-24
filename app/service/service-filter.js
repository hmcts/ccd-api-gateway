const serviceTokenGenerator = require('./service-token-generator');
const { safeError } = require('../safe-errors');

const serviceFilter = (req, res, next) => {
  serviceTokenGenerator()
    .then(token => {
      req.headers['ServiceAuthorization'] = token;
      next();
    })
    .catch(error => {
      const status = error.name === 'FetchError' ? 500 : error.status || 401;
      next(safeError(status, error));
    });
};

module.exports = serviceFilter;
