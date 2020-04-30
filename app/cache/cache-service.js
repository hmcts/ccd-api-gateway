const NodeCache = require('node-cache');
const { Logger } = require('@hmcts/nodejs-logging');
const logger = Logger.getLogger('CacheService');

class Cache {

  constructor(name, ttlSeconds, checkPeriodSeconds) {
    this.cache = new NodeCache({ stdTTL: ttlSeconds, checkperiod: checkPeriodSeconds });
    this.name = name;
  }

  get(key, storeFunction) {
    const value = this.cache.get(key);
    if (value) {
      return Promise.resolve(value);
    }

    return storeFunction().then(result => {
      this.cache.set(key, result);
      return result;
    }).catch(error => {
      logger.warn(`Error in store function for cache '${this.name}' with key '${key}'`);
      throw error;
    });
  }

  del(keys) {
    return this.cache.del(keys);
  }
}

module.exports = Cache;
