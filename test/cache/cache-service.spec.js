const chai = require('chai');
const expect = chai.expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const assert = sinon.assert;
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

const storeFunction = () => {
    return Promise.resolve('TestFunctionValue');
};

describe('CacheService create and get keys', () => {
    const KEY = 'Key';
    const VALUE = 'Value';
    const TEST_FUNCTION_VALUE = 'TestFunctionValue';

    let MockNodeCache;
    let CacheService;

    let getStub;
    let setStub;
    let deleteStub;
    let nodeCacheSpy;

    let cache;

    beforeEach(() => {
        getStub = sinon.stub();
        setStub = sinon.stub();
        deleteStub = sinon.stub();

        MockNodeCache = {
            get: getStub,
            set: setStub,
            del: deleteStub
        };

        nodeCacheSpy = sinon.spy(function () { return MockNodeCache; });

        CacheService = proxyquire('../../app/cache/cache-service', { 'node-cache': nodeCacheSpy });
        cache = new CacheService(5, 1);
    });

    it('should get existing cache value', async () => {
        getStub.returns(VALUE);

        const result = await cache.get(KEY, storeFunction);

        expect(result).to.equal(VALUE);
        assert.calledWithNew(nodeCacheSpy);
        assert.calledWith(getStub, KEY);
        assert.notCalled(setStub);
    });

    it('should create new cache value for non-existing key', async () => {
        getStub.returns(undefined);

        const result = await cache.get(KEY, storeFunction);

        expect(result).to.equal(TEST_FUNCTION_VALUE);
        assert.calledWithNew(nodeCacheSpy);
        assert.calledWith(getStub, KEY);
        assert.calledWith(setStub, KEY, TEST_FUNCTION_VALUE);
    });

    it('should delete existing cache value', () => {
        cache.del(KEY);

        assert.calledWithNew(nodeCacheSpy);
        assert.calledWith(deleteStub, KEY);
        assert.notCalled(getStub);
        assert.notCalled(setStub);
    });
});  
