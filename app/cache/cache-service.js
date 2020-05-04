const NodeCache = require('node-cache');
const { Logger } = require('@hmcts/nodejs-logging');
const logger = Logger.getLogger('CacheService');

class Cache {

  constructor(name, ttlSeconds, checkPeriodSeconds) {
    this.cache = new NodeCache({ stdTTL: ttlSeconds, checkperiod: checkPeriodSeconds });
    this.name = name;
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, value) {
    this.cache.set(key, value);
  }

  /**
   * If given key is already in the cache, returns associated value.
   * Otherwise, computes value from given expression op, stores with key in the cache and returns that value.
   */
  getOrElseUpdate(key, op) {
    const value = this.get(key);
    if (value) {
      return Promise.resolve(value);
    }

    return op().then(result => {
      this.set(key, result);
      return result;
    }).catch(error => {
      logger.warn(`Error in store function for cache '${this.name}'`);
      throw error;
    });
  }

  del(keys) {
    return this.cache.del(keys);
  }
}

module.exports = Cache;
