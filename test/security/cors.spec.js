import * as chai from 'chai';
import esmock from 'esmock';
import sinon from 'sinon';

const assert = sinon.assert;
import sinonChai from 'sinon-chai';
import sinonExpressMock from 'sinon-express-mock';
chai.use(sinonChai);

describe('CORS', () => {

  const ORIGIN = 'http://localhost:3451';
  const ORIGIN_2 = 'http://ccd-aat.platform.hmcts.net';
  const METHODS = 'GET,POST,OPTIONS,PUT,DELETE';
  const HEADERS = 'Authorization';

  let config, req, res, next, handleCors;

  beforeEach(async () => {
    config = {
      get: sinon.stub()
    };

    config.get.withArgs('security.cors_origin_whitelist').returns(ORIGIN);
    config.get.withArgs('security.cors_origin_methods').returns(METHODS);

    req = sinonExpressMock.mockReq();
    req.get.withArgs('origin').returns(ORIGIN);
    req.get.withArgs('Access-Control-Request-Headers').returns(HEADERS);

    res = sinonExpressMock.mockRes({});
    next = sinon.stub();

    handleCors = await esmock('../../app/security/cors.js', {
      'config': config
    });
  });

  it('should add CORS headers to response', () => {
    handleCors(req, res, next);

    assert.calledWith(res.set, 'Access-Control-Allow-Origin', ORIGIN);
    assert.calledWith(res.set, 'Access-Control-Allow-Credentials', true);
    assert.calledWith(res.set, 'Access-Control-Allow-Methods', METHODS);
    assert.calledWith(res.set, 'Access-Control-Allow-Headers', HEADERS);
  });

  it('should support multiple whitelisted origins', () => {
    config.get.withArgs('security.cors_origin_whitelist').returns(`${ORIGIN},${ORIGIN_2}`);
    req.get.withArgs('origin').returns(ORIGIN_2);

    handleCors(req, res, next);

    assert.calledWith(res.set, 'Access-Control-Allow-Origin', ORIGIN_2);
  });

  it('should not allow non-whitelisted origins', () => {
    req.get.withArgs('origin').returns(ORIGIN_2);

    handleCors(req, res, next);

    assert.neverCalledWith(res.set, 'Access-Control-Allow-Origin', ORIGIN_2);
  });

  it('should allow any origin when whitelist contains wildcard *', () => {
    config.get.withArgs('security.cors_origin_whitelist').returns(`${ORIGIN},*`);
    req.get.withArgs('origin').returns(ORIGIN_2);

    handleCors(req, res, next);

    assert.calledWith(res.set, 'Access-Control-Allow-Origin', ORIGIN_2);
  });
});
