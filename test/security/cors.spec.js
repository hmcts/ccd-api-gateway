const chai = require('chai');
const expect = chai.expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const sinonExpressMock = require('sinon-express-mock');
chai.use(sinonChai);

describe('CORS', () => {

  const ORIGIN_1 = 'https://www-ccd.aat.platform.hmcts.net';
  const ORIGIN_2 = 'https://manage-case.aat.platform.hmcts.net';
  const UNAUTHORISED_ORIGIN = 'https://test.com';

  const METHODS = 'GET,POST,PUT,PATCH,DELETE,OPTIONS';
  const HEADERS = 'Content-Type, Authorization';

  let config, req, res, next, handleCors;

  beforeEach(() => {
    config = {
      get: sinon.stub()
    };

    // default whitelist
    config.get.withArgs('security.cors_origin_whitelist')
      .returns(`${ORIGIN_1},${ORIGIN_2}`);

    config.get.withArgs('security.cors_origin_methods')
      .returns(METHODS);

    req = sinonExpressMock.mockReq();
    res = sinonExpressMock.mockRes({});
    next = sinon.stub();

    handleCors = proxyquire('../../app/security/cors', {
      config
    });
  });

  it('should allow requests from whitelisted origin', () => {
    req.get.withArgs('origin').returns(ORIGIN_1);
    req.get.withArgs('Access-Control-Request-Headers').returns(HEADERS);

    handleCors(req, res, next);

    expect(res.set).to.have.been.calledWith(
      'Access-Control-Allow-Origin',
      ORIGIN_1
    );

    expect(res.set).to.have.been.calledWith(
      'Access-Control-Allow-Credentials',
      true
    );

    expect(res.set).to.have.been.calledWith(
      'Access-Control-Allow-Methods',
      METHODS
    );

    expect(res.set).to.have.been.calledWith(
      'Access-Control-Allow-Headers',
      HEADERS
    );

    expect(next).to.have.been.called;
  });

  it('should allow multiple whitelisted origins', () => {
    req.get.withArgs('origin').returns(ORIGIN_2);
    req.get.withArgs('Access-Control-Request-Headers').returns(HEADERS);

    handleCors(req, res, next);

    expect(res.set).to.have.been.calledWith(
      'Access-Control-Allow-Origin',
      ORIGIN_2
    );
  });

  it('should reject non-whitelisted origins with 403', () => {
    req.get.withArgs('origin').returns(UNAUTHORISED_ORIGIN);

    handleCors(req, res, next);

    expect(res.status).to.have.been.calledWith(403);
    expect(res.end).to.have.been.called;
    expect(res.set).not.to.have.been.calledWith(
      'Access-Control-Allow-Origin',
      UNAUTHORISED_ORIGIN
    );
  });

  it('should require origin header', () => {
    req.get.withArgs('origin').returns(undefined);

    handleCors(req, res, next);

    expect(res.status).to.have.been.calledWith(403);
    expect(res.end).to.have.been.called;
  });

  describe('CORS wildcard pattern support', () => {

    const WILDCARD = 'https://*.preview.platform.hmcts.net';

    beforeEach(() => {
      config.get.withArgs('security.cors_origin_whitelist')
        .returns(WILDCARD);
    });

    it('should allow valid preview subdomain', () => {
      const origin = 'https://ccd-api-gateway-web-pr-712.preview.platform.hmcts.net';

      req.get.withArgs('origin').returns(origin);
      req.get.withArgs('Access-Control-Request-Headers').returns(HEADERS);

      handleCors(req, res, next);

      expect(res.set).to.have.been.calledWith(
        'Access-Control-Allow-Origin',
        origin
      );
      expect(next).to.have.been.called;
    });

    it('should reject different domain (hmcts2)', () => {
      const origin = 'https://ccd-api-gateway-web-pr-712.preview.platform.hmcts2.net';

      req.get.withArgs('origin').returns(origin);

      handleCors(req, res, next);

      expect(res.status).to.have.been.calledWith(403);
    });

    it('should reject nested subdomains', () => {
      const origin = 'https://a.b.preview.platform.hmcts.net';

      req.get.withArgs('origin').returns(origin);

      handleCors(req, res, next);

      expect(res.status).to.have.been.calledWith(403);
    });

    it('should reject suffix attack domains', () => {
      const origin = 'https://preview.platform.hmcts.net.test.com';

      req.get.withArgs('origin').returns(origin);

      handleCors(req, res, next);

      expect(res.status).to.have.been.calledWith(403);
    });

    it('should reject completely unrelated domains', () => {
      const origin = 'https://test.com';

      req.get.withArgs('origin').returns(origin);

      handleCors(req, res, next);

      expect(res.status).to.have.been.calledWith(403);
    });

  });

});
