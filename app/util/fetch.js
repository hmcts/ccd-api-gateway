const _fetch = require('node-fetch');

const fetch = (...args) => {
  return _fetch(...args)
    .then(res => {

      if (res.status >= 200 && res.status < 300) {
          return res;
      }

      // A Response has no useful stack; preserve bounded upstream diagnostics privately.
      return res.text().then((body) => {
        const error = new Error(`Upstream HTTP ${res.status} ${res.statusText}: ${body.slice(0, 4096)}`);
        error.status = res.status;
        throw error;
      });
    });
};

module.exports = fetch;
