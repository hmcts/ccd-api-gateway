const chai = require('chai');
const expect = chai.expect;
const fetchMock = require('fetch-mock');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
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
  const AUTH_CODE = 'xyz789';
  const BASIC_AUTH_HEADER = 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64');

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
  let fetch;
  let unsuccessfulFetch;
  let accessTokenRequest;
  let unsuccessfulAccessTokenRequest;
  let clientAuth;

  beforeEach(() => {
    config = {
      get: sinon.stub()
    };
    clientAuth = {
      getBasicAuthHeader: sinon.stub().returns(BASIC_AUTH_HEADER)
    };

    fetch = fetchMock.sandbox().post(`begin:${TOKEN_ENDPOINT}`, SUCCESSFUL_RESPONSE);
    accessTokenRequest = proxyquire('../../app/oauth2/access-token-request', {
      'config': config,
      'node-fetch': fetch,
      './client-auth': clientAuth
    });

    unsuccessfulFetch = fetchMock.sandbox().post(`begin:${TOKEN_ENDPOINT}`, UNSUCCESSFUL_RESPONSE);
    unsuccessfulAccessTokenRequest = proxyquire('../../app/oauth2/access-token-request', {
      'config': config,
      'node-fetch': unsuccessfulFetch,
      './client-auth': clientAuth
    });
  });

  it('should call the IdAM OAuth 2 token endpoint with the correct headers and query string parameters', done => {
    config.get.withArgs('idam.oauth2.token_endpoint').returns(TOKEN_ENDPOINT);

    accessTokenRequest(REQUEST_WITH_HTTPS)
      .then(() => {
        expect(fetch.called()).to.be.true;
        expect(fetch.lastOptions().headers['Authorization']).to.equal(BASIC_AUTH_HEADER);
        expect(clientAuth.getBasicAuthHeader).to.have.been.calledOnce;
        let requestedUrl = url.parse(fetch.lastUrl(), true);
        expect(requestedUrl.query.code).to.equal(AUTH_CODE);
        expect(requestedUrl.query.redirect_uri).to.equal(REDIRECT_URL);
        done();
      })
      .catch(error => done(new Error(error)));
  });

  it('should add `https://` prefix', done => {
    config.get.withArgs('idam.oauth2.token_endpoint').returns(TOKEN_ENDPOINT);

    accessTokenRequest(REQUEST)
      .then(() => {
        expect(fetch.called()).to.be.true;
        expect(fetch.lastOptions().headers['Authorization']).to.equal(BASIC_AUTH_HEADER);
        expect(clientAuth.getBasicAuthHeader).to.have.been.calledOnce;
        let requestedUrl = url.parse(fetch.lastUrl(), true);
        expect(requestedUrl.query.code).to.equal(AUTH_CODE);
        expect(requestedUrl.query.redirect_uri).to.equal(REDIRECT_URL);
        done();
      })
      .catch(error => done(new Error(error)));
  });


  it('should handle unsuccessful responses.', done => {

    config.get.withArgs('idam.oauth2.token_endpoint').returns(TOKEN_ENDPOINT);

    unsuccessfulAccessTokenRequest(REQUEST)
      .then((response) => {
        expect(unsuccessfulFetch.called()).to.be.true;
        expect(unsuccessfulFetch.lastOptions().headers['Authorization']).to.equal(BASIC_AUTH_HEADER);
        expect(clientAuth.getBasicAuthHeader).to.have.been.calledOnce;
        let requestedUrl = url.parse(unsuccessfulFetch.lastUrl(), true);
        expect(requestedUrl.query.code).to.equal(AUTH_CODE);
        expect(requestedUrl.query.redirect_uri).to.equal(REDIRECT_URL);
        expect(response).to.have.property('status', 401);
        done();
      })
      .catch(error => done(new Error(error)));
  });

  it('should reject undefined uri requests.', async () => {
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
