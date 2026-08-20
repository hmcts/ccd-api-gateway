const _fetch = require('node-fetch');

const fetch = (...args) => {
  return _fetch(...args)
    .then(res => {

      if (res.status >= 200 && res.status < 300) {
          return res;
      }

      const error = new Error(`HTTP Error: ${res.status}`);
      error.response = res;
      throw error;
    });
};

module.exports = fetch;
