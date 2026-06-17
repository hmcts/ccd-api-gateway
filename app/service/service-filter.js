import serviceTokenGenerator from './service-token-generator.js';
import { Logger } from '@hmcts/nodejs-logging';

const logger = Logger.getLogger('serviceFilter');

const serviceFilter = (req, res, next) => {
    serviceTokenGenerator()
        .then(t => {
            req.headers['ServiceAuthorization'] = t;
            next();
        })
        .catch(error => {
          if (error.name === 'FetchError') {
              logger.error(error);
              next({
                status: 500,
                error: 'Internal Server Error',
                message: error.message
              });
          } else {
              logger.warn('Unsuccessful S2S authentication', error);
              next({
                  status: error.status || 401
              });
          }
    });
};

export {serviceFilter};
