const chai = require('chai');
const expect = chai.expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const nock = require('nock');
const jwt = require('jsonwebtoken');
const moment = require('moment');

describe('service token generator', () => {

  let serviceTokenGenerator;

  beforeEach(() => {
    let config = {
      get: sinon.stub()
    };
    config.get.withArgs('secrets.s2s.microservicekey-ccd-gw').returns('AAAA');
    config.get.withArgs('idam.s2s_url').returns('http://localhost:9999');
    config.get.withArgs('appInsights.enabled').returns(false);

    serviceTokenGenerator = proxyquire('../../app/service/service-token-generator', {
      'config': config
    });

    proxyquire('../../app/app-insights/app-insights', {
      'config': config
    });
  });
  describe('generate()', () => {
    it('should return token', async function () {
      const expectedResult = jwt.sign({exp: moment().unix()}, 'secret');
      nock('http://localhost:9999')
        .post('/lease')
        .reply(200, expectedResult);

      const secret = await serviceTokenGenerator();
      expect(secret).to.equal(expectedResult);
    });

    it('should return same token when called twice', async function () {
      const expectedResult = jwt.sign({exp: moment().add(3, 'hours').unix()}, 'secret');
      nock('http://localhost:9999')
        .post('/lease')
        .reply(200, expectedResult);

      const secret1 = await serviceTokenGenerator();
      expect(secret1).to.equal(expectedResult);

      const secret2 = await serviceTokenGenerator();
      expect(secret2).to.equal(expectedResult);
    });

  });
});
