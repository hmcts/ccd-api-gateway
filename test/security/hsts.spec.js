const chai = require('chai');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const assert = sinon.assert;
const sinonChai = require('sinon-chai').default;
const sinonExpressMock = require('sinon-express-mock');
chai.use(sinonChai);

describe('HSTS', () => {

  const MAX_AGE_WITH_SUBDOMAINS = 'max-age=31536000; includeSubDomains';

  let req, res, next, handleHSTS;

  beforeEach(() => {
    req = sinonExpressMock.mockReq();
    res = sinonExpressMock.mockRes({});
    next = sinon.stub();

    handleHSTS = proxyquire('../../app/security/hsts', {});
  });

  it('should add STS header to response for data request', () => {
    req.method = 'GET';
    handleHSTS(req, res, next);

    assert.calledWith(res.set, 'Strict-Transport-Security', MAX_AGE_WITH_SUBDOMAINS);
  });

  it('should add STS header to response for communication options request', () => {
    req.method = 'OPTIONS';
    handleHSTS(req, res, next);

    assert.calledWith(res.set, 'Strict-Transport-Security', MAX_AGE_WITH_SUBDOMAINS);
  });

});
