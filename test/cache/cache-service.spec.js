import {expect} from 'chai';
import * as chai from 'chai';
import esmock from 'esmock';
import sinon from 'sinon';

const assert = sinon.assert;
import sinonChai from 'sinon-chai';

chai.use(sinonChai);
import CacheService from '../../app/cache/cache-service.js';
import NodeCache from 'node-cache';

describe('CacheService', () => {
    const KEY = 'Key';
    const SECOND_KEY = 'Other Key';
    const STORE_FUNCTION_VALUE = 'Store Function Value';
    const SECOND_STORE_FUNCTION_VALUE = 'Other Store Function Value';
    const CACHE_TTL_SECONDS = 1800;

    const storeFunction = () => Promise.resolve(STORE_FUNCTION_VALUE);
    const secondStoreFunction = () => Promise.resolve(SECOND_STORE_FUNCTION_VALUE);

    describe('create and get keys (mocked node-cache)', () => {
        let MockNodeCache;
        let StubbedCacheService;

        let getStub;
        let setStub;
        let deleteStub;
        let nodeCacheSpy;

        let cache;

        beforeEach(async () => {
          getStub = sinon.stub();
          setStub = sinon.stub();
          deleteStub = sinon.stub();

          MockNodeCache = {
            get: getStub,
            set: setStub,
            del: deleteStub
          };

          nodeCacheSpy = sinon.spy(function () {
            return MockNodeCache;
          });

          StubbedCacheService = await esmock('../../app/cache/cache-service', {'node-cache': nodeCacheSpy});
          cache = new StubbedCacheService('TestCache', CACHE_TTL_SECONDS, 120);
        });

        it('should get existing cache value', async () => {
            getStub.returns(STORE_FUNCTION_VALUE);

            const result = await cache.getOrElseUpdate(KEY, storeFunction);

            expect(result).to.equal(STORE_FUNCTION_VALUE);
            assert.calledWithNew(nodeCacheSpy);
            assert.calledWith(getStub, KEY);
            assert.notCalled(setStub);
        });

        it('should create new cache value for non-existing key', async () => {
            getStub.returns(undefined);

            const result = await cache.getOrElseUpdate(KEY, storeFunction);

            expect(result).to.equal(STORE_FUNCTION_VALUE);
            assert.calledWithNew(nodeCacheSpy);
            assert.calledWith(getStub, KEY);
            assert.calledWith(setStub, KEY, STORE_FUNCTION_VALUE);
        });

        it('should delete existing cache value', async () => {
            await cache.getOrElseUpdate(KEY, storeFunction);

            cache.del(KEY);

            assert.calledWithNew(nodeCacheSpy);
            assert.calledWith(deleteStub, KEY);
            assert.calledOnce(getStub);
            assert.calledOnce(setStub);
        });
    });

    describe('create and get keys', () => {
        let sandbox;
        let clock;
        let getSpy;
        let setSpy;
        let delSpy;

        let cache;

        beforeEach(() => {
            sandbox = sinon.createSandbox();
            clock = sandbox.useFakeTimers();
            getSpy = sandbox.spy(NodeCache.prototype, 'get');
            setSpy = sandbox.spy(NodeCache.prototype, 'set');
            delSpy = sandbox.spy(NodeCache.prototype, 'del');
            cache = new CacheService('TestCache', CACHE_TTL_SECONDS, 120);
        });

        afterEach(() => {
            sandbox.restore();
            clock.restore();
        });

        it('should use store function for key with no cache', async () => {
            const result = await cache.getOrElseUpdate(KEY, storeFunction);

            expect(result).to.equal(STORE_FUNCTION_VALUE);
            assert.calledWith(getSpy, KEY);
            assert.calledWith(setSpy, KEY, STORE_FUNCTION_VALUE);
            assert.calledOnce(getSpy);
            assert.calledOnce(setSpy);
        });

        it('should get cached value', async () => {
            const firstResult = await cache.getOrElseUpdate(KEY, storeFunction);
            const cachedResult = await cache.getOrElseUpdate(KEY, secondStoreFunction);

            expect(firstResult).to.equal(cachedResult);
            expect(cachedResult).to.equal(STORE_FUNCTION_VALUE);
            assert.calledWith(getSpy, KEY);
            assert.calledWith(setSpy, KEY, STORE_FUNCTION_VALUE);
            assert.calledTwice(getSpy);
            assert.calledOnce(setSpy);
        });

        it('should use different store functions for different keys with no cache', async () => {
            const firstResult = await cache.getOrElseUpdate(KEY, storeFunction);
            const secondResult = await cache.getOrElseUpdate(SECOND_KEY, secondStoreFunction);

            expect(firstResult).to.equal(STORE_FUNCTION_VALUE);
            expect(secondResult).to.equal(SECOND_STORE_FUNCTION_VALUE);
            assert.calledWith(getSpy, KEY);
            assert.calledWith(getSpy, SECOND_KEY);
            assert.calledWith(setSpy, KEY, STORE_FUNCTION_VALUE);
            assert.calledWith(setSpy, SECOND_KEY, SECOND_STORE_FUNCTION_VALUE);
            assert.calledTwice(getSpy);
            assert.calledTwice(setSpy);
        });

        it('should get new value after ttl expiry', async () => {
            await cache.getOrElseUpdate(KEY, storeFunction);
            clock.tick(CACHE_TTL_SECONDS * 1000 + 1);

            const result = await cache.getOrElseUpdate(KEY, secondStoreFunction);

            expect(result).to.equal(SECOND_STORE_FUNCTION_VALUE);
            assert.calledWith(getSpy, KEY);
            assert.calledWith(setSpy, KEY, STORE_FUNCTION_VALUE);
            assert.calledWith(setSpy, KEY, SECOND_STORE_FUNCTION_VALUE);
            assert.calledTwice(getSpy);
            assert.calledTwice(setSpy);
        });

        it('should get new value after key deletion', async () => {
            await cache.getOrElseUpdate(KEY, storeFunction);
            cache.del(KEY);

            const result = await cache.getOrElseUpdate(KEY, secondStoreFunction);

            expect(result).to.equal(SECOND_STORE_FUNCTION_VALUE);
            assert.calledWith(getSpy, KEY);
            assert.calledWith(setSpy, KEY, STORE_FUNCTION_VALUE);
            assert.calledWith(setSpy, KEY, SECOND_STORE_FUNCTION_VALUE);
            assert.calledTwice(getSpy);
            assert.calledTwice(setSpy);
        });

        it('should delete cache value', async () => {
            await cache.getOrElseUpdate(KEY, storeFunction);

            const result = cache.del(KEY);

            expect(result).to.equal(1);
            assert.calledWith(getSpy, KEY);
            assert.calledWith(setSpy, KEY, STORE_FUNCTION_VALUE);
            assert.calledWith(delSpy, KEY);
            assert.calledOnce(getSpy);
            assert.calledOnce(setSpy);
            assert.calledOnce(delSpy);
        });

        it('should not cache any value when store function errors', async (done) => {
            let result;
            try {
                result = await cache.getOrElseUpdate(KEY, () => new Error());
            } catch(error) {
                expect(error).to.not.equal(undefined);
                expect(result).to.equal(undefined);
                assert.calledOnce(getSpy);
                assert.notCalled(setSpy);
                done();
            }
        });
    });
});
