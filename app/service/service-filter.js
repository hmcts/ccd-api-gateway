import { Logger } from '@hmcts/nodejs-logging';

const serviceTokenGenerator = require('./service-token-generator');
const LOGGER = Logger.getLogger(__filename);

const serviceFilter = (req, res, next) => {
  serviceTokenGenerator()
    .then(t => {
      req.headers['ServiceAuthorization'] = t;
        next();
    })
    .catch(error => {
      if (error.name === 'FetchError') {
        // console.error(error);
        LOGGER.error(error);
        next({
          status: 500,
          error: 'Internal Server Error',
          message: error.message
        });
      } else {
        // console.warn('Unsuccessful S2S authentication', error);
        LOGGER.warn('Unsuccessful S2S authentication', error);
        next({
          status: error.status || 401
        });
      }
    });
};

module.exports = serviceFilter;
