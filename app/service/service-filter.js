const serviceTokenGenerator = require('./service-token-generator');

const serviceFilter = (req, res, next) => {
  serviceTokenGenerator()
    .then(token => {
      req.headers['ServiceAuthorization'] = token;
      next();
    })
    .catch(error => {
      const status = error.name === 'FetchError' ? 500 : error.status || 401;
      next({ status, cause: error });
    });
};

module.exports = serviceFilter;
