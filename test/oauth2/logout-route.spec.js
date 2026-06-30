import * as chai from 'chai';
import {expect} from 'chai';
import esmock from 'esmock';
import sinon from  'sinon';
const assert = sinon.assert;
import sinonChai from 'sinon-chai';
import sinonExpressMock from 'sinon-express-mock';
import {COOKIE_ACCESS_TOKEN} from '../../app/oauth2/oauth2-route.js';
chai.use(sinonChai);
import nock from 'nock';
import CacheService from '../../app/cache/cache-service.js';

let logoutRoute;
let getCachedUserDetails;

describe('logoutRoute', () => {
  const CLIENT_ID = 'ccd_gateway';
  const CLIENT_SECRET = 'abc123def456';
  const ACCESS_TOKEN = 'eycdjc7hf3478g4f37';
  const LOGOUT_END_POINT = 'http://localhost/session/:token';
  const CACHE_TTL_SECONDS = 1800;
  const TOKEN = 'TOKEN';

  let request;
  let response;
  let next;
  let config;
  let fetchStub;
  let fetch;
  let userInfoCacheSpy;
  let sandbox;
  let clock;
  let userInfoCacheInstance;

  beforeEach(async () => {
    config = {
      get: sinon.stub()
    };
    sandbox = sinon.createSandbox();
    clock = sandbox.useFakeTimers();
    userInfoCacheInstance = new CacheService('UserInfoCache', CACHE_TTL_SECONDS, 120);
    userInfoCacheSpy = sandbox.spy(userInfoCacheInstance, 'getOrElseUpdate');

    ({ getCachedUserDetails } = await esmock('../../app/user/cached-user-resolver.js', {
      '../../app/cache/cache-config.js':  { userInfoCache: () => userInfoCacheInstance }
    }));

    config.get.withArgs('idam.oauth2.client_id').returns(CLIENT_ID);
    config.get.withArgs('secrets.ccd.ccd-api-gateway-oauth2-client-secret').returns(CLIENT_SECRET);
    config.get.withArgs('idam.oauth2.logout_endpoint').returns(LOGOUT_END_POINT);

    request = sinonExpressMock.mockReq({
      cookies: {
        [COOKIE_ACCESS_TOKEN]: ACCESS_TOKEN
      }
    });
    response = sinonExpressMock.mockRes();
    next = sinon.stub();

    fetchStub = sinon.stub();
    fetch = {
      default: fetchStub.callsFake(function () {
        return Promise.resolve({});
      })
    };

    const result = await esmock('../../app/oauth2/logout-route.js', {
      'config': config,
      'node-fetch': fetch
    });
    logoutRoute = result.logoutRoute;
  });

  afterEach(() => {
    sandbox.restore();
    clock.restore();
    if (!nock.isDone()) {
      assert.fail('Not all nock interceptors have completed');
    }
  });

  it('should call IDAM OAuth 2 logout endpoint with JWT token', done => {
    response.status.callsFake(() => {
      try {
        assert.calledWith(fetchStub, LOGOUT_END_POINT.replace(':token', ACCESS_TOKEN));
        assert.notCalled(next);
        assert.calledWith(response.clearCookie, COOKIE_ACCESS_TOKEN);

        clock.tick(CACHE_TTL_SECONDS * 1000 + 1);

        getCachedUserDetails(TOKEN);
        const result = getCachedUserDetails(TOKEN);
        expect(JSON.stringify(result)).to.equal('{}');
        assert.calledWith(userInfoCacheSpy, TOKEN, sinon.match.func);
        assert.calledTwice(userInfoCacheSpy);

        assert.calledWith(response.status, 204);
        done();
      } catch (e) {
        done(e);
      }
    });

    logoutRoute(request, response, next);

    assert.calledWith(config.get, 'idam.oauth2.client_id');
    assert.calledWith(config.get, 'secrets.ccd.ccd-api-gateway-oauth2-client-secret');
    assert.calledWith(config.get, 'idam.oauth2.logout_endpoint');
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
