const chai = require('chai');
const expect = chai.expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const assert = sinon.assert;
const sinonChai = require('sinon-chai').default;
const sinonExpressMock = require('sinon-express-mock');
const url = require('url');
chai.use(sinonChai);

describe('Access Token Request', () => {
  const CLIENT_ID = 'ccd_gateway';
  const CLIENT_SECRET = 'abc123def456';
  const TOKEN_ENDPOINT = 'http://localhost:1234/oauth2/token';
  const REDIRECT_URN = 'localhost/redirect/to';
  const REDIRECT_URL = 'https://localhost/redirect/to';
  const UNDEFINED_URI = 'undefined:///oauth2redirect';
  const DISALLOWED_URI = 'https://attacker.com/steal';
  const AUTH_CODE = 'xyz789';
  const REDIRECT_ALLOWLIST = 'localhost';

  const REQUEST = sinonExpressMock.mockReq({
    query: {
      code: AUTH_CODE,
      redirect_uri: REDIRECT_URN
    }
  });
  const REQUEST_WITH_HTTPS = sinonExpressMock.mockReq({
    query: {
      code: AUTH_CODE,

      redirect_uri: REDIRECT_URL
    }
  });
  const REQUEST_UNDEFINED_URI = sinonExpressMock.mockReq({
    query: {
      code: AUTH_CODE,
      redirect_uri: UNDEFINED_URI
    }
  });
  const SUCCESSFUL_RESPONSE = {
    body: {
      'access_token': 'q1w2e3r4t5y6',
      'token_type': 'Bearer',
      'expires_in'
        : 3600
    },
    status: 200
  };

  const UNSUCCESSFUL_RESPONSE = {
    status: 401
  };

  let config;
  let successStub;
  let fetch;
  let unsuccessfulStub;
  let unsuccessfulFetch;
  let accessTokenRequest;
  let unsuccessfulAccessTokenRequest;

  beforeEach(() => {
    config = {
      get: sinon.stub()
    };
    config.get.withArgs('idam.oauth2.redirect_uri_allowlist').returns(REDIRECT_ALLOWLIST);

    successStub = sinon.stub();
    fetch = {
      default: successStub.callsFake(function(...args) {
        let requestedUrl = url.parse(args[0], true);
        expect(requestedUrl.query.code).to.equal(AUTH_CODE);
        expect(requestedUrl.query.redirect_uri).to.equal(REDIRECT_URL);
        return Promise.resolve(SUCCESSFUL_RESPONSE);
      })
    };
    accessTokenRequest = proxyquire('../../app/oauth2/access-token-request', {
      'config': config,
      'node-fetch': fetch
    });

    unsuccessfulStub = sinon.stub();
    unsuccessfulFetch = {
      default: unsuccessfulStub.callsFake(function(...args) {
        let requestedUrl = url.parse(args[0], true);
        expect(requestedUrl.query.code).to.equal(AUTH_CODE);
        expect(requestedUrl.query.redirect_uri).to.equal(REDIRECT_URL);
        return Promise.resolve(UNSUCCESSFUL_RESPONSE);
      })
    };
    unsuccessfulAccessTokenRequest = proxyquire('../../app/oauth2/access-token-request', {
      'config': config,
      'node-fetch': unsuccessfulFetch
    });
  });

  it('should call the IdAM OAuth 2 token endpoint with the correct headers and query string parameters', done => {
    config.get.withArgs('idam.oauth2.client_id').returns(CLIENT_ID);
    config.get.withArgs('secrets.ccd.ccd-api-gateway-oauth2-client-secret').returns(CLIENT_SECRET);
    config.get.withArgs('idam.oauth2.token_endpoint').returns(TOKEN_ENDPOINT);

    accessTokenRequest(REQUEST_WITH_HTTPS)
      .then(() => {
        assert.called(successStub);
        expect(successStub.firstCall.args[1].headers.Authorization).to.equal('Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'));
        done();
      })
      .catch(error => done(new Error(error)));
  });

  it('should add `https://` prefix', done => {
    config.get.withArgs('idam.oauth2.client_id').returns(CLIENT_ID);
    config.get.withArgs('secrets.ccd.ccd-api-gateway-oauth2-client-secret').returns(CLIENT_SECRET);
    config.get.withArgs('idam.oauth2.token_endpoint').returns(TOKEN_ENDPOINT);

    accessTokenRequest(REQUEST)
      .then(() => {
        assert.called(successStub);
        expect(successStub.firstCall.args[1].headers.Authorization).to.equal('Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'));
        done();
      })
      .catch(error => done(new Error(error)));
  });


  it('should handle unsuccessful responses.', done => {

    config.get.withArgs('idam.oauth2.client_id').returns(CLIENT_ID);
    config.get.withArgs('secrets.ccd.ccd-api-gateway-oauth2-client-secret').returns(CLIENT_SECRET);
    config.get.withArgs('idam.oauth2.token_endpoint').returns(TOKEN_ENDPOINT);

    unsuccessfulAccessTokenRequest(REQUEST)
      .then((response) => {
        assert.called(unsuccessfulStub);
        expect(unsuccessfulStub.firstCall.args[1].headers.Authorization).to.equal('Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'));
        expect(response).to.have.property('status', 401);
        done();
      })
      .catch(error => done(new Error(error)));
  });

  it('should reject undefined uri requests.', async () => {
    config.get.withArgs('idam.oauth2.client_id').returns(CLIENT_ID);
    config.get.withArgs('secrets.ccd.ccd-api-gateway-oauth2-client-secret').returns(CLIENT_SECRET);
    config.get.withArgs('idam.oauth2.token_endpoint').returns(TOKEN_ENDPOINT);
    try {
      await accessTokenRequest(REQUEST_UNDEFINED_URI);
      expect.fail('Expected error to be thrown');
    } catch (error) {
        expect(error.status).to.deep.equal(400);
        expect(error.error).to.deep.equal('Bad Request');
        expect(error.message).to.deep.equal('Redirect URI is not permitted');
    }
  });

  it('should reject redirect URIs with disallowed hosts.', async () => {
    config.get.withArgs('idam.oauth2.client_id').returns(CLIENT_ID);
    config.get.withArgs('secrets.ccd.ccd-api-gateway-oauth2-client-secret').returns(CLIENT_SECRET);
    config.get.withArgs('idam.oauth2.token_endpoint').returns(TOKEN_ENDPOINT);
    const REQUEST_DISALLOWED = sinonExpressMock.mockReq({
      query: { code: AUTH_CODE, redirect_uri: DISALLOWED_URI }
    });
    try {
      await accessTokenRequest(REQUEST_DISALLOWED);
      expect.fail('Expected error to be thrown');
    } catch (error) {
        expect(error.status).to.deep.equal(400);
        expect(error.error).to.deep.equal('Bad Request');
        expect(error.message).to.deep.equal('Redirect URI is not permitted');
    }
  });
});
