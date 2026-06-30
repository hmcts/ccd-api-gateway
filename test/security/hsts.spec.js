import * as chai from 'chai';
import esmock from 'esmock';
import sinon from 'sinon';
const assert = sinon.assert;
import sinonChai from 'sinon-chai';
import sinonExpressMock from 'sinon-express-mock';
chai.use(sinonChai);

describe('HSTS', () => {

  const MAX_AGE_WITH_SUBDOMAINS = 'max-age=31536000; includeSubDomains';

  let req, res, next, handleHSTS;

  beforeEach(async () => {
    req = sinonExpressMock.mockReq();
    res = sinonExpressMock.mockRes({});
    next = sinon.stub();

    handleHSTS = await esmock('../../app/security/hsts.js', {});
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
