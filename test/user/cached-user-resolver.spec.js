import * as chai from 'chai';
import { expect } from 'chai';
import esmock from 'esmock';
import sinon from 'sinon';
const assert = sinon.assert;
import sinonChai from 'sinon-chai';
chai.use(sinonChai);
import nock from 'nock';
import CacheService from '../../app/cache/cache-service.js';
import NodeCache from 'node-cache';

describe('getCachedUserDetails', () => {
  const TOKEN = 'TOKEN';
  const USER_DETAILS = { user: 'Details' };
  const OTHER_TOKEN = 'OtherToken';
  const OTHER_DETAILS = { user: 'Other Details' };
  const ERROR_TOKEN = 'ErrorToken';
  const CACHE_TTL_SECONDS = 1800;

  let nodeCacheSpy;
  let sandbox;
  let clock;
  let userResolver;
  let cachedUserResolver;
  let userInfoCache;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    userResolver = {
      getUserDetails: sinon.stub()
    };
    userResolver.getUserDetails.withArgs(TOKEN).returns(Promise.resolve(USER_DETAILS));
    userResolver.getUserDetails.withArgs(`Bearer ${TOKEN}`).returns(Promise.resolve(USER_DETAILS));
    userResolver.getUserDetails.withArgs(OTHER_TOKEN).returns(Promise.resolve(OTHER_DETAILS));
    userResolver.getUserDetails.withArgs(ERROR_TOKEN).returns(Promise.reject(new Error('User details error')));
    clock = sandbox.useFakeTimers();
    nodeCacheSpy = sandbox.spy(NodeCache.prototype, 'set');
    userInfoCache = new CacheService('UserInfoCache', CACHE_TTL_SECONDS, 120);
    cachedUserResolver = await esmock('../../app/user/cached-user-resolver.js', {
      '../../app/cache/cache-config.js': { userInfoCache },
      '../../app/user/user-resolver.js': { getUserDetails: userResolver.getUserDetails }
    });
  });

  afterEach(() => {
    sandbox.restore();
    clock.restore();
    if (!nock.isDone()) {
      assert.fail('Not all nock interceptors have completed');
    }
  });

  it('should get user details with no cache', async () => {
    const result = await cachedUserResolver.getCachedUserDetails(TOKEN);

    expect(JSON.stringify(result)).to.equal(JSON.stringify(USER_DETAILS));
    assert.calledOnce(nodeCacheSpy);
  });

  it('should get cached user details', async () => {
    const firstResult = await cachedUserResolver.getCachedUserDetails(TOKEN);
    const cachedResult = await cachedUserResolver.getCachedUserDetails(TOKEN);

    expect(JSON.stringify(firstResult)).to.equal(JSON.stringify(cachedResult));
    expect(JSON.stringify(cachedResult)).to.equal(JSON.stringify(USER_DETAILS));
    assert.calledOnce(nodeCacheSpy);
  });

  it('should get cached user details with token including Bearer', async () => {
    const firstResult = await cachedUserResolver.getCachedUserDetails(TOKEN);
    const cachedResult = await cachedUserResolver.getCachedUserDetails(`Bearer ${TOKEN}`);

    expect(JSON.stringify(firstResult)).to.equal(JSON.stringify(cachedResult));
    expect(JSON.stringify(cachedResult)).to.equal(JSON.stringify(USER_DETAILS));
    assert.calledOnce(nodeCacheSpy);
  });

  it('should get user details with no cache for different tokens', async () => {
    const originalResult = await cachedUserResolver.getCachedUserDetails(TOKEN);
    const otherResult = await cachedUserResolver.getCachedUserDetails(OTHER_TOKEN);

    expect(JSON.stringify(originalResult)).to.equal(JSON.stringify(USER_DETAILS));
    expect(JSON.stringify(otherResult)).to.equal(JSON.stringify(OTHER_DETAILS));
    assert.calledTwice(nodeCacheSpy);
  });

  it('should get new user details after ttl expiry', async () => {
    await cachedUserResolver.getCachedUserDetails(TOKEN);
    clock.tick(CACHE_TTL_SECONDS * 1000 + 1);

    const result = await cachedUserResolver.getCachedUserDetails(TOKEN);

    expect(JSON.stringify(result)).to.equal(JSON.stringify(USER_DETAILS));
    assert.calledTwice(nodeCacheSpy);
  });

  it('should not cache when error is returned', async () => {
    let result;
    let error;
    try {
      result = await cachedUserResolver.getCachedUserDetails(ERROR_TOKEN);
    } catch(err) {
      error = err;
    }

    expect(error).to.not.equal(undefined);
    expect(result).to.equal(undefined);
    assert.notCalled(nodeCacheSpy);
  });
});
