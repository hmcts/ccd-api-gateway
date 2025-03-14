const enableAppInsights = require('./app/app-insights/app-insights');

enableAppInsights();

let express = require('express');
let cookieParser = require('cookie-parser');
let proxy = require('http-proxy-middleware');
const config = require('config');
const { Express: ExpressLogger, Logger } = require('@hmcts/nodejs-logging');
const {authCheckerUserOnlyFilter} = require('./app/user/auth-checker-user-only-filter');
const {mapFetchErrors} = require('./app/user/auth-checker-user-only-filter');
const addressLookup = require('./app/address/address-lookup');
const serviceFilter = require('./app/service/service-filter');
const corsHandler = require('./app/security/cors');
const handleTiming = require('./app/security/timing');
const hstsHandler = require('./app/security/hsts');
const healthcheck = require('@hmcts/nodejs-healthcheck');
const routes = require('@hmcts/nodejs-healthcheck/healthcheck/routes');
const oauth2Route = require('./app/oauth2/oauth2-route').oauth2Route;
const logoutRoute = require('./app/oauth2/logout-route').logoutRoute;
const noCache = require('nocache');
const noSniff = require('dont-sniff-mimetype');

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
      console.error(err);
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

module.exports = app;
