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
  const REDIRECT_URI = 'http://localhost/redirect/to';
  const AUTH_CODE = 'xyz789';

  const REQUEST = sinonExpressMock.mockReq({
    query: {
      code: AUTH_CODE,
      redirect_uri: REDIRECT_URI
    }
  });
  const RESPONSE = {
    body: {
      'access_token': 'q1w2e3r4t5y6',
      'token_type': 'Bearer',
      'expires_in': 3600
    },
    status: 200
  };

  let config;
  let fetch;
  let accessTokenRequest;

  beforeEach(() => {
    config = {
      get: sinon.stub()
    };
    fetch = fetchMock.sandbox().post(`begin:${TOKEN_ENDPOINT}`, RESPONSE);

    accessTokenRequest = proxyquire('./access-token-request', {
      'config': config,
      'node-fetch': fetch
    });
  });

  it('should call the IdAM OAuth 2 token endpoint with the correct headers and query string parameters', done => {
    config.get.withArgs('idam.oauth2.client_id').returns(CLIENT_ID);
    config.get.withArgs('idam.oauth2.client_secret').returns(CLIENT_SECRET);
    config.get.withArgs('idam.oauth2.token_endpoint').returns(TOKEN_ENDPOINT);

    accessTokenRequest(REQUEST)
      .then(() => {
        expect(fetch.called()).to.be.true;
        expect(fetch.lastOptions().headers['Authorization']).to.equal('Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'));
        let requestedUrl = url.parse(fetch.lastUrl(), true);
        expect(requestedUrl.query.code).to.equal(AUTH_CODE);
        expect(requestedUrl.query.redirect_uri).to.equal(REDIRECT_URI);
        done();
      })
      .catch(error => done(new Error(error)));
  });
});
