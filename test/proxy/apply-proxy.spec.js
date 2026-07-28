const chai = require('chai');
const expect = chai.expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

describe('applyProxy', () => {
  let app;
  let createProxyMiddleware;
  let mapFetchErrors;
  let middleware;
  let applyProxy;

  beforeEach(() => {
    app = {
      use: sinon.stub()
    };
    middleware = sinon.stub();
    createProxyMiddleware = sinon.stub().returns(middleware);
    mapFetchErrors = sinon.stub();

    applyProxy = proxyquire('../../app/proxy/apply-proxy', {
      'http-proxy-middleware': {
        createProxyMiddleware
      },
      '../user/auth-checker-user-only-filter': {
        mapFetchErrors
      }
    }).applyProxy;
  });

  it('uses the v4 proxy API and mounts it at the configured source', () => {
    applyProxy(app, {
      source: '/data',
      target: 'http://data-api'
    });

    expect(app.use.firstCall.args[0]).to.equal('/data');
    expect(app.use.firstCall.args[1]).to.be.a('function');
    expect(createProxyMiddleware).to.have.been.calledOnce;
    expect(createProxyMiddleware.firstCall.args[0].target).to.equal('http://data-api');
  });

  it('maps proxy errors through the Express error chain', () => {
    const req = {};
    const res = {};
    const next = sinon.stub();
    const error = new Error('connect ECONNREFUSED');

    middleware.callsArgWith(2, error);

    applyProxy(app, {
      source: '/data',
      target: 'http://data-api'
    });
    app.use.firstCall.args[1](req, res, next);

    expect(mapFetchErrors).to.have.been.calledWith(error, res, next);
  });

  it('makes legacy full-path filters relative to the Express mount point', () => {
    applyProxy(app, {
      source: '/payments',
      target: 'http://payments-api/payments',
      filter: [
        '/payments/cases/**/payments',
        '/payments/card-payments/**'
      ]
    });

    expect(createProxyMiddleware.firstCall.args[0].pathFilter).to.deep.equal([
      '/cases/**/payments',
      '/card-payments/**'
    ]);
  });

  it('preserves the source path when rewriting is disabled', () => {
    applyProxy(app, {
      source: '/aggregated',
      target: 'http://aggregated-api',
      rewrite: false
    });

    const rewrite = createProxyMiddleware.firstCall.args[0].pathRewrite;
    expect(rewrite('/case/123')).to.equal('/aggregated/case/123');
    expect(rewrite('/?page=2')).to.equal('/aggregated?page=2');
  });

  it('rewrites the mounted source to the configured URL', () => {
    applyProxy(app, {
      source: '/em-anno',
      target: 'http://annotations-api',
      rewriteUrl: '/api'
    });

    const rewrite = createProxyMiddleware.firstCall.args[0].pathRewrite;
    expect(rewrite('/annotations/123')).to.equal('/api/annotations/123');
    expect(rewrite('/')).to.equal('/api');
  });
});
