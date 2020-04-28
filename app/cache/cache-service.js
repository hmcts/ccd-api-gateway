const NodeCache = require("node-cache");

class Cache {

  constructor(ttlSeconds, checkPeriodSeconds) {
    this.cache = new NodeCache({ stdTTL: ttlSeconds, checkperiod: checkPeriodSeconds });
  }

  get(key, storeFunction) {
    const value = this.cache.get(key);
    if (value) {
      return Promise.resolve(value);
    }

    return storeFunction().then((result) => {
      this.cache.set(key, result);
      return result;
    });
  }

  del(keys) {
    this.cache.del(keys);
  }
}

module.exports = Cache;
