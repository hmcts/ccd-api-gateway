import enableAppInsights from './app/app-insights/app-insights.js';
import payloadGuard from './app/service/service-payloadGuard.js';

import express from 'express';
import cookieParser from 'cookie-parser';
import { legacyCreateProxyMiddleware as proxy } from 'http-proxy-middleware';
import config from 'config';
import { Express as ExpressLogger, Logger } from '@hmcts/nodejs-logging';
import {authCheckerUserOnlyFilter} from './app/user/auth-checker-user-only-filter.js';
import {mapFetchErrors} from './app/user/auth-checker-user-only-filter.js';
import addressLookup from './app/address/address-lookup.js';
import serviceFilter from './app/service/service-filter.js';
import corsHandler from './app/security/cors.js';
import handleTiming from './app/security/timing.js';
import hstsHandler from './app/security/hsts.js';
import healthcheck from '@hmcts/nodejs-healthcheck';
import routes from '@hmcts/nodejs-healthcheck/healthcheck/routes';
import {oauth2Route} from './app/oauth2/oauth2-route.js';
import {logoutRoute} from './app/oauth2/logout-route.js';
import noCache from 'nocache';
import noSniff from 'dont-sniff-mimetype';

enableAppInsights();

let app = express();
const appHealth = express();
const logger = Logger.getLogger('app');

app.use(ExpressLogger.accessLogger());
app.use(cookieParser());

const poweredByHeader = 'x-powered-by';
app.disable(poweredByHeader);
appHealth.disable(poweredByHeader);

const applyProxy = (app, config) => {
  let options = {
    target: config.target,
    changeOrigin: true,
    onError: function onError(err, req, res) {
      logger.error(err);
      mapFetchErrors(err, res);
    },
    logLevel: 'warn'
  };

  if (false !== config.rewrite) {
    options.pathRewrite = {
      [`^${config.source}`]: config.rewriteUrl || ''
    };
  }

  if (config.filter) {
    app.use(config.source, proxy(config.filter, options));
  } else {
    app.use(config.source, proxy(options));
  }
};

let healthConfig = {
  checks: {}
};
healthcheck.addTo(appHealth, healthConfig);
appHealth.get('/', routes.configure(healthConfig));
app.use(appHealth);

app.use(noCache());
app.use(noSniff());
app.use(hstsHandler);
app.use(corsHandler);
app.use(handleTiming);

app.get('/oauth2', oauth2Route);

app.use(authCheckerUserOnlyFilter);

app.get('/logout', logoutRoute);

app.use(serviceFilter);

// parsing + basic size limits (protects DoS)
app.use('/data', express.json({ limit: '1mb', strict: true }));
app.use('/data', express.urlencoded({ limit: '1mb', extended: false }));

// lightweight safety/validation middleware
app.use('/data', payloadGuard({
  allowContentTypes: ['application/json'],
  maxArrayLength: 10000,           // sanity cap
  rejectPathTraversal: true,
  rejectObviousScriptTags: true
}));

app.get('/addresses',(req, res, next) => {
  addressLookup(req.query.postcode)
      .then(result => res.send(result))
      .catch(err => next(err));
});

applyProxy(app, {
  source: '/aggregated',
  target: config.get('proxy.aggregated'),
  rewrite: false
});

applyProxy(app, {
  source: '/data',
  target: config.get('proxy.data')
});

applyProxy(app, {
  source: '/definition_import',
  target: config.get('proxy.definition_import')
});

applyProxy(app, {
  source: '/documents',
  target: config.get('proxy.document_management'),
  rewrite: false
});

applyProxy(app, {
  source: '/em-anno',
  target: config.get('proxy.mv_annotations'),
  rewrite: true,
  rewriteUrl: '/api'
});

applyProxy(app, {
  source: '/print',
  target: config.get('proxy.print_service')
});

applyProxy(app, {
  source: '/activity',
  target: config.get('proxy.case_activity')
});

applyProxy(app, {
  source: '/payments',
  target: config.get('proxy.payments'),
  filter: [
    '/payments/cases/**/payments',
    '/payments/card-payments/**',
    '/payments/credit-account-payments/**',
    '/payments/payment-groups/**',
    '/payments/cases/**/paymentgroups'
  ]
});

applyProxy(app, {
  source: '/pay-bulkscan',
  target: config.get('proxy.pay_bulkscan'),
  filter: [
    '/pay-bulkscan/cases/**'
  ]
});

applyProxy(app, {
  source: '/refdata',
  target: config.get('proxy.refdata')
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) { // eslint-disable-line no-unused-vars
  logger.error(err);

  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  let status = isNaN(err.status) ? 500 : err.status;
  res.status(status);
  res.json({
    error: err.error || 'Unauthorized',
    status: status,
    message: err.message || 'You are not authorised to access that resource'
  });
});

export default app;
