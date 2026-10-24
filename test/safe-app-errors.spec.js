const assert = require('assert');
const proxyquire = require('proxyquire').noCallThru();
const request = require('supertest');
const { mapFetchErrors } = proxyquire('../app/user/auth-checker-user-only-filter', {
  './user-request-authorizer': {}
});

const pass = (req, res, next) => next();
const createApp = (authFailure) => proxyquire('../app', {
  './app/app-insights/app-insights': () => {},
  config: { get: () => 'http://127.0.0.1:1' },
  './app/user/auth-checker-user-only-filter': {
    authCheckerUserOnlyFilter: (req, res, next) => next(authFailure),
    mapFetchErrors
  },
  './app/service/service-filter': pass,
  './app/address/address-lookup': () => Promise.reject(new Error('SECRET internal-host')),
  './app/security/cors': pass,
  './app/security/timing': pass,
  '@hmcts/nodejs-healthcheck': { addTo: () => {} },
  '@hmcts/nodejs-healthcheck/healthcheck/routes': { configure: () => pass },
  './app/oauth2/oauth2-route': { oauth2Route: pass },
  './app/oauth2/logout-route': { logoutRoute: pass }
});

describe('CCD-7882 application error wiring', () => {
  it('redacts a real proxy connection failure using the application onError callback', async () => {
    const response = await request(createApp()).get('/data/cases');
    assert.strictEqual(response.status, 502);
    assert.strictEqual(response.body.status, 502);
    assert.strictEqual(response.body.code, 'INTERNAL_ERROR');
    assert(!JSON.stringify(response.body).includes('ECONNREFUSED'));
    assert(!JSON.stringify(response.body).includes('127.0.0.1'));
  });

  it('routes an authentication failure to the safe final middleware', async () => {
    const failure = new Error('SECRET bearer diagnostic');
    failure.status = 401;
    const response = await request(createApp(failure)).get('/data/cases');
    assert.strictEqual(response.status, 401);
    assert.strictEqual(response.body.code, 'AUTHENTICATION_REQUIRED');
    assert(!JSON.stringify(response.body).includes('SECRET'));
  });

  it('redacts a route dependency failure through the real application middleware', async () => {
    const response = await request(createApp()).get('/addresses?postcode=test');
    assert.strictEqual(response.status, 500);
    assert.strictEqual(response.body.code, 'INTERNAL_ERROR');
    assert(!JSON.stringify(response.body).includes('SECRET'));
  });
});
