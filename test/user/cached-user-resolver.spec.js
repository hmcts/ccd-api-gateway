const proxyquire =  require('proxyquire');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const assert = sinon.assert;
const sinonChai = require('sinon-chai');
chai.use(sinonChai);
const nock = require('nock');
const CacheService = require('../../app/cache/cache-service');
const NodeCache = require('node-cache');

describe('getCachedUserDetails', () => {
  const TOKEN = 'TOKEN';
  const USER_DETAILS = { user: 'Details' };
  const URL = 'http://test-idam:1234';
  const DETAILS_PATH = '/o/userinfo';
  const CACHE_TTL_SECONDS = 1800;

  let userInfoCacheSpy;
  let nodeCacheSpy;
  let sandbox;
  let clock;

  let cachedUserResolver;
  let userInfoCache;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    clock = sandbox.useFakeTimers();
    nodeCacheSpy = sandbox.spy(NodeCache.prototype, 'set');
    userInfoCache = new CacheService('UserInfoCache', CACHE_TTL_SECONDS, 120);
    userInfoCacheSpy = sandbox.spy(userInfoCache, 'getOrElseUpdate');
    cachedUserResolver = proxyquire('../../app/user/cached-user-resolver', {
      '../cache/cache-config': { userInfoCache }
    });
  });

  afterEach(() => {
    sandbox.restore();
    clock.restore();
    if (!nock.isDone()) {
      chai.assert.fail('Not all nock interceptors have completed');
    }
  });

  it('should get user details with no cache', async () => {
    initNock(TOKEN, USER_DETAILS);
    const result = await cachedUserResolver.getUserDetails(TOKEN);

    expect(JSON.stringify(result)).to.equal(JSON.stringify(USER_DETAILS));
    assert.calledWith(userInfoCacheSpy, TOKEN, sinon.match.func);
    assert.calledOnce(userInfoCacheSpy);
    assert.calledOnce(nodeCacheSpy);
  });

  it('should get cached user details', async () => {
    initNock(TOKEN, USER_DETAILS);
    const firstResult = await cachedUserResolver.getUserDetails(TOKEN);
    const cachedResult = await cachedUserResolver.getUserDetails(TOKEN);

    expect(JSON.stringify(firstResult)).to.equal(JSON.stringify(cachedResult));
    expect(JSON.stringify(cachedResult)).to.equal(JSON.stringify(USER_DETAILS));
    assert.calledWith(userInfoCacheSpy, TOKEN, sinon.match.func);
    assert.calledTwice(userInfoCacheSpy);
    assert.calledOnce(nodeCacheSpy);
  });

  it('should get cached user details with token including Bearer', async () => {
    initNock(TOKEN, USER_DETAILS);
    const firstResult = await cachedUserResolver.getUserDetails(TOKEN);
    const cachedResult = await cachedUserResolver.getUserDetails(`Bearer ${TOKEN}`);

    expect(JSON.stringify(firstResult)).to.equal(JSON.stringify(cachedResult));
    expect(JSON.stringify(cachedResult)).to.equal(JSON.stringify(USER_DETAILS));
    assert.calledWith(userInfoCacheSpy, TOKEN, sinon.match.func);
    assert.calledTwice(userInfoCacheSpy);
    assert.calledOnce(nodeCacheSpy);
  });

  it('should get user details with no cache for different tokens', async () => {
    const OTHER_TOKEN = 'OtherToken';
    const OTHER_DETAILS = { user: 'Other Details' };
    initNock(TOKEN, USER_DETAILS);
    initNock(OTHER_TOKEN, OTHER_DETAILS);

    const originalResult = await cachedUserResolver.getUserDetails(TOKEN);
    const otherResult = await cachedUserResolver.getUserDetails(OTHER_TOKEN);

    expect(JSON.stringify(originalResult)).to.equal(JSON.stringify(USER_DETAILS));
    expect(JSON.stringify(otherResult)).to.equal(JSON.stringify(OTHER_DETAILS));
    assert.calledWith(userInfoCacheSpy, TOKEN, sinon.match.func);
    assert.calledWith(userInfoCacheSpy, OTHER_TOKEN, sinon.match.func);
    assert.calledTwice(userInfoCacheSpy);
    assert.calledTwice(nodeCacheSpy);
  });

  it('should get new user details after ttl expiry', async () => {
    initNock(TOKEN, USER_DETAILS);
    await cachedUserResolver.getUserDetails(TOKEN);
    clock.tick(CACHE_TTL_SECONDS * 1000 + 1);
    initNock(TOKEN, USER_DETAILS);

    const result = await cachedUserResolver.getUserDetails(TOKEN);

    expect(JSON.stringify(result)).to.equal(JSON.stringify(USER_DETAILS));
    assert.calledWith(userInfoCacheSpy, TOKEN, sinon.match.func);
    assert.calledTwice(userInfoCacheSpy);
    assert.calledTwice(nodeCacheSpy);
  });

  it('should not cache when error is returned', async () => {
    nock(URL).get(DETAILS_PATH).reply(500);

    let result;
    try {
      result = await cachedUserResolver.getUserDetails(TOKEN);
    } catch(error) {
      expect(error).to.not.equal(undefined);
      expect(result).to.equal(undefined);
      assert.calledOnce(userInfoCacheSpy);
      assert.notCalled(nodeCacheSpy);
      return;
    }

    chai.assert.fail('getUserDetails did not throw error');
  });

  const initNock = (token, details) => {
    nock(URL, {
      reqheaders: {
        Authorization: `Bearer ${token}`
      }
    }).get(DETAILS_PATH)
      .times(1)
      .reply(200, details);
  };
});
