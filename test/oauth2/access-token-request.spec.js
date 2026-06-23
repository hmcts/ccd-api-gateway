import * as chai from 'chai';
import {expect} from 'chai';
import esmock from 'esmock';
import sinon from 'sinon';
const assert = sinon.assert;
import sinonChai from 'sinon-chai';
import sinonExpressMock from 'sinon-express-mock';
import url from 'url';
chai.use(sinonChai);

describe('Access Token Request', () => {
  const CLIENT_ID = 'ccd_gateway';
  const CLIENT_SECRET = 'abc123def456';
  const TOKEN_ENDPOINT = 'http://localhost:1234/oauth2/token';
  const REDIRECT_URN = 'localhost/redirect/to';
  const REDIRECT_URL = 'https://localhost/redirect/to';
  const UNDEFINED_URI = 'undefined:///oauth2redirect';
  const AUTH_CODE = 'xyz789';

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

  beforeEach(async () => {
    config = {
      get: sinon.stub()
    };

    successStub = sinon.stub();
    fetch = {
      default: successStub.callsFake(function (...args) {
        let requestedUrl = url.parse(args[0], true);
        expect(requestedUrl.query.code).to.equal(AUTH_CODE);
        expect(requestedUrl.query.redirect_uri).to.equal(REDIRECT_URL);
        return Promise.resolve(SUCCESSFUL_RESPONSE);
      })
    };
    accessTokenRequest = await esmock('../../app/oauth2/access-token-request.js', {
      'config': config,
      'node-fetch': fetch
    });

    unsuccessfulStub = sinon.stub();
    unsuccessfulFetch = {
      default: unsuccessfulStub.callsFake(function (...args) {
        let requestedUrl = url.parse(args[0], true);
        expect(requestedUrl.query.code).to.equal(AUTH_CODE);
        expect(requestedUrl.query.redirect_uri).to.equal(REDIRECT_URL);
        return Promise.resolve(UNSUCCESSFUL_RESPONSE);
      })
    };
    unsuccessfulAccessTokenRequest = await esmock('../../app/oauth2/access-token-request.js', {
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
    } catch (error) {
        expect(error.status).to.deep.equal(400);
        expect(error.error).to.deep.equal('Bad Request');
        expect(error.message).to.deep.equal('Redirect URI cannot start with undefined');
    }
  });
});
