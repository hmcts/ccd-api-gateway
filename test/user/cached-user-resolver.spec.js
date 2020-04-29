const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const assert = sinon.assert;
const sinonChai = require('sinon-chai');
chai.use(sinonChai);
const cachedUserResolver = require('../../app/user/cached-user-resolver');
const userInfoCache = require('../../app/cache/cache-config').userInfoCache;
const jwtUtil = require('../../app/util/jwt');

describe('getCachedUserDetails', () => {
    const TOKEN = 'TOKEN';
    const USER_DETAILS = { user: 'details' };

    let userInfoCacheStub;
    let jwtUtilStub;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        userInfoCacheStub = sandbox.stub(userInfoCache, 'get');
        jwtUtilStub = sandbox.stub(jwtUtil, 'getJwt').returns('hello');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should get cached user details', async () => {
        jwtUtilStub.returns(TOKEN);
        userInfoCacheStub.returns(USER_DETAILS);

        const result = await cachedUserResolver.getUserDetails(TOKEN);

        expect(result).to.equal(USER_DETAILS);
        assert.called(jwtUtilStub);
        assert.calledWith(userInfoCacheStub, TOKEN, sinon.match.func);
    });
});
