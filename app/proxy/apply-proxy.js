const { createProxyMiddleware } = require('http-proxy-middleware');
const { mapFetchErrors } = require('../user/auth-checker-user-only-filter');

const prefixMountedPath = (prefix, path) => {
  if (path === '/') {
    return prefix;
  }

  if (path.startsWith('/?')) {
    return `${prefix}${path.substring(1)}`;
  }

  return `${prefix}${path}`;
};

const relativePathFilters = (source, filters) => filters.map(filter => {
  return filter.startsWith(source) ? filter.substring(source.length) || '/' : filter;
});

const applyProxy = (app, proxyConfig) => {
  const options = {
    target: proxyConfig.target,
    changeOrigin: true,
    on: {
      error: function onError(err) {
        console.error(err);
      }
    }
  };

  if (proxyConfig.filter) {
    options.pathFilter = relativePathFilters(proxyConfig.source, proxyConfig.filter);
  }

  if (proxyConfig.rewrite === false) {
    options.pathRewrite = path => prefixMountedPath(proxyConfig.source, path);
  } else if (proxyConfig.rewriteUrl) {
    options.pathRewrite = path => prefixMountedPath(proxyConfig.rewriteUrl, path);
  }

  const proxyMiddleware = createProxyMiddleware(options);

  app.use(proxyConfig.source, (req, res, next) => {
    proxyMiddleware(req, res, err => {
      if (err) {
        mapFetchErrors(err, res, next);
      } else {
        next();
      }
    });
  });
};

module.exports = {
  applyProxy
};
