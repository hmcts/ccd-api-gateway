const serviceTokenGenerator = require('./service-token-generator');

const serviceFilter = (req, res, next) => {
    serviceTokenGenerator()
        .then(t => {
            req.headers['ServiceAuthorization'] = t;
            next();
        })
        .catch(error => {
          if(error.errno === 'ENOTFOUND') {
            console.error('Unknown S2S host', error);
            next({
              status: 500,
              error: 'Internal Server Error',
              message: 'Some error happened while calling S2S token generation'
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
