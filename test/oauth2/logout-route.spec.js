const chai = require('chai');
const expect = chai.expect;
const fetchMock = require('fetch-mock');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const sinonExpressMock = require('sinon-express-mock');
const ACCESS_TOKEN_COOKIE_NAME = require('../../app/oauth2/oauth2-route').COOKIE_ACCESS_TOKEN;
chai.use(sinonChai);

describe('logoutRoute', () => {
  const CLIENT_ID = 'ccd_gateway';
  const CLIENT_SECRET = 'abc123def456';
  const ACCESS_TOKEN = 'eycdjc7hf3478g4f37';
  const LOGOUT_END_POINT = 'http://localhost/session/:token';

  let request;
  let response;
  let next;
  let config;
  let logoutRoute;
  let fetch;

  beforeEach(() => {
    config = {
      get: sinon.stub()
    };
    config.get.withArgs('idam.oauth2.client_id').returns(CLIENT_ID);
    config.get.withArgs('secrets.ccd.ccd-api-gateway-oauth2-client-secret').returns(CLIENT_SECRET);
    config.get.withArgs('idam.oauth2.logout_endpoint').returns(LOGOUT_END_POINT);

    request = sinonExpressMock.mockReq({
      cookies: {
        [ACCESS_TOKEN_COOKIE_NAME]: ACCESS_TOKEN
      }
    });
    response = sinonExpressMock.mockRes();
    next = sinon.stub();

    fetch = fetchMock.sandbox().delete(LOGOUT_END_POINT.replace(':token', ACCESS_TOKEN), {});

    logoutRoute = proxyquire('../../app/oauth2/logout-route', {
      'config': config,
      'node-fetch': fetch
    }).logoutRoute;
  });

  it('should call IDAM OAuth 2 logout endpoint with JWT token', done => {
    response.status.callsFake(() => {
      try {
        expect(fetch.called(LOGOUT_END_POINT.replace(':token', ACCESS_TOKEN))).to.be.true;
        expect(fetch.lastOptions().headers['Authorization']).to.equal('Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'));
        expect(next).not.to.be.called;
        expect(response.clearCookie).to.be.calledWith(ACCESS_TOKEN_COOKIE_NAME);
        expect(response.status).to.be.calledWith(204);
        done();
      } catch (e) {
        done(e);
      }
    });

    logoutRoute(request, response, next);

    expect(config.get).to.be.calledWith('idam.oauth2.client_id');
    expect(config.get).to.be.calledWith('secrets.ccd.ccd-api-gateway-oauth2-client-secret');
    expect(config.get).to.be.calledWith('idam.oauth2.logout_endpoint');
  });

  it('should return 400 error when cookies missing', () => {
    request = sinonExpressMock.mockReq({});

    logoutRoute(request, response, next);

    expect(response.redirect).not.to.be.called;
    expect(next).to.be.calledWith({
      error: 'No auth token',
      status: 400,
      message: 'No auth token to log out'
    });
  });

  it('should return 400 error when cookie `accessToken` is missing', () => {
    request = sinonExpressMock.mockReq({
      cookies: {}
    });

    logoutRoute(request, response, next);

    expect(response.redirect).not.to.be.called;
    expect(next).to.be.calledWith({
      error: 'No auth token',
      status: 400,
      message: 'No auth token to log out'
    });
  });
});
