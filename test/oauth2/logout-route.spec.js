const chai = require('chai');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const assert = sinon.assert;
const expect = chai.expect;
const sinonChai = require('sinon-chai').default;
const sinonExpressMock = require('sinon-express-mock');
const ACCESS_TOKEN_COOKIE_NAME = require('../../app/oauth2/oauth2-route').COOKIE_ACCESS_TOKEN;
chai.use(sinonChai);
const nock = require('nock');
const CacheService = require('../../app/cache/cache-service');
const fetchMock = require('fetch-mock').default;

describe('logoutRoute', () => {
  const CLIENT_ID = 'ccd_gateway';
  const CLIENT_SECRET = 'abc123def456';
  const ACCESS_TOKEN = 'eycdjc7hf3478g4f37';
  const HMCTS_ACCESS_URL = 'http://localhost:4321';
  const LOGOUT_END_POINT = HMCTS_ACCESS_URL + '/o/endSession?token=' + ACCESS_TOKEN;
  const CACHE_TTL_SECONDS = 1800;
  const TOKEN = 'TOKEN';
  const USER_DETAILS = { user: 'Details' };

  let request;
  let response;
  let next;
  let config;
  let logoutRoute;
  let fetchMockInstance;
  let fetch;
  let userInfoCacheSpy;
  let sandbox;
  let clock;

  let cachedUserResolver;
  let userInfoCache;

  beforeEach(() => {
    config = {
      get: sinon.stub()
    };
    sandbox = sinon.createSandbox();
    clock = sandbox.useFakeTimers();
    userInfoCache = new CacheService('UserInfoCache', CACHE_TTL_SECONDS, 120);
    userInfoCacheSpy = sandbox.spy(userInfoCache, 'getOrElseUpdate');
    cachedUserResolver = proxyquire('../../app/user/cached-user-resolver', {
      '../cache/cache-config': { userInfoCache },
      './user-resolver': {
        getUserDetails: sandbox.stub().withArgs(TOKEN).resolves(USER_DETAILS)
      }
    });

    config.get.withArgs('idam.oauth2.client_id').returns(CLIENT_ID);
    config.get.withArgs('secrets.ccd.ccd-api-gateway-oauth2-client-secret').returns(CLIENT_SECRET);
    config.get.withArgs('idam.web_public_url').returns(HMCTS_ACCESS_URL);

    request = sinonExpressMock.mockReq({
      cookies: {
        [ACCESS_TOKEN_COOKIE_NAME]: ACCESS_TOKEN
      }
    });
    response = sinonExpressMock.mockRes();
    next = sinon.stub();

    fetchMockInstance = fetchMock.createInstance().get(LOGOUT_END_POINT.replace(':token', ACCESS_TOKEN), {});
    fetch = fetchMockInstance.fetchHandler;

    logoutRoute = proxyquire('../../app/oauth2/logout-route', {
      'config': config,
      'node-fetch': { default: fetch }
    }).logoutRoute;
  });

  afterEach(() => {
    sandbox.restore();
    clock.restore();
    if (!nock.isDone()) {
      assert.fail('Not all nock interceptors have completed');
    }
  });

  it('should call IDAM OAuth 2 logout endpoint with JWT token', async () => {
    const logoutComplete = new Promise(resolve => response.status.callsFake(resolve));
    logoutRoute(request, response, next);

    expect(config.get).to.be.calledWith('idam.oauth2.client_id');
    expect(config.get).to.be.calledWith('secrets.ccd.ccd-api-gateway-oauth2-client-secret');
    expect(config.get).to.be.calledWith('idam.web_public_url');

    await logoutComplete;

    expect(fetchMockInstance.callHistory.called(LOGOUT_END_POINT.replace(':token', ACCESS_TOKEN))).to.be.true;
    expect(next).not.to.be.called;
    expect(response.clearCookie).to.be.calledWith(ACCESS_TOKEN_COOKIE_NAME);

    await cachedUserResolver.getUserDetails(TOKEN);
    clock.tick(CACHE_TTL_SECONDS * 1000 + 1);

    const result = await cachedUserResolver.getUserDetails(TOKEN);
    expect(JSON.stringify(result)).to.equal(JSON.stringify(USER_DETAILS));
    assert.calledWith(userInfoCacheSpy, TOKEN, sinon.match.func);
    assert.calledTwice(userInfoCacheSpy);

    expect(response.status).to.be.calledWith(204);
  });

  it('should return 400 error when cookies missing', () => {
    request = sinonExpressMock.mockReq({});

    logoutRoute(request, response, next);

    assert.notCalled(response.redirect);
    assert.calledWith(next, {
      error: 'No auth token',
      status: 400,
      message: 'No auth token to log out'
    });
  });

  it('should return 400 error when cookie `accessToken` is missing', () => {
    request = sinonExpressMock.mockReq({
      cookies: {}
    });

    logoutRoute(request, response, next);

    assert.notCalled(response.redirect);
    assert.calledWith(next, {
      error: 'No auth token',
      status: 400,
      message: 'No auth token to log out'
    });
  });
});
