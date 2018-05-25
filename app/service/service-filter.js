const serviceTokenGenerator = require('./service-token-generator');

const serviceFilter = (req, res, next) => {
    serviceTokenGenerator()
        .then(t => {
            req.headers['ServiceAuthorization'] = t;
            next();
        })
        .catch(error => {
          if (error.name === 'FetchError') {
              console.error(error);
              next({
                status: 500,
                error: 'Internal Server Error',
                message: 'Something went wrong when calling S2S token service'
              });
          } else {
              console.warn('Unsuccessful S2S authentication', error);
              next({
                  status: error.status || 401
              });
          }
    });
};

module.exports = serviceFilter;
