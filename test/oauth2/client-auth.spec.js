const chai = require('chai');
const expect = chai.expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');

describe('OAuth2 client auth helper', () => {
  let config;
  let clientAuth;

  beforeEach(() => {
    config = {
      get: sinon.stub()
    };

    clientAuth = proxyquire('../../app/oauth2/client-auth', {
      'config': config
    });
  });

  it('should build the Basic authorization header from configured credentials', () => {
    config.get.withArgs('idam.oauth2.client_id').returns('ccd_gateway');
    config.get.withArgs('secrets.ccd.ccd-api-gateway-oauth2-client-secret').returns('abc123def456');

    expect(clientAuth.getBasicAuthHeader())
      .to.equal(`Basic ${Buffer.from('ccd_gateway:abc123def456').toString('base64')}`);
  });

  it('should throw when the OAuth2 client secret is missing', () => {
    config.get.withArgs('idam.oauth2.client_id').returns('ccd_gateway');
    config.get.withArgs('secrets.ccd.ccd-api-gateway-oauth2-client-secret').returns('');

    expect(() => clientAuth.getBasicAuthHeader())
      .to.throw('Missing required config: secrets.ccd.ccd-api-gateway-oauth2-client-secret');
  });

  it('should redact Authorization headers before logging', () => {
    expect(clientAuth.redactAuthorizationHeader({
      Authorization: 'Basic Y2NkX2dhdGV3YXk6YWJjMTIzZGVmNDU2',
      'Content-Type': 'application/x-www-form-urlencoded'
    })).to.deep.equal({
      Authorization: 'Basic [REDACTED]',
      'Content-Type': 'application/x-www-form-urlencoded'
    });
  });
});