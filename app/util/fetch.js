const _fetch = require('node-fetch');
const { Logger } = require('@hmcts/nodejs-logging');
const logger = Logger.getLogger('fetch');

const fetch = (...args) => {
  logger.error('fetch inside');
  return _fetch(...args)
    .then(res => {

      logger.error('fetch before res: ', res)
      logger.error('fetch before res,status: ', res.status)

      if (res.status >= 200 && res.status < 300) {
          return res;
      }

      logger.error('fetch after res: ', res)


      return Promise.reject(res);
    })
    .catch(err => logger.error('fetch inside catch res: ', err))
    .finally(res => logger.error('fetch finally res: ', res));
};

module.exports = fetch;
