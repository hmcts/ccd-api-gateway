const chai = require('chai');
const expect = chai.expect;
const fetchMock = require('fetch-mock');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const sinonExpressMock = require('sinon-express-mock');
const COOKIE_ACCESS_TOKEN = require('../../app/oauth2/oauth2-route').COOKIE_ACCESS_TOKEN;
chai.use(sinonChai);

describe('logoutRoute', () => {
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
    config.get.withArgs('idam.oauth2.logout_endpoint').returns(LOGOUT_END_POINT);

    request = sinonExpressMock.mockReq({
      cookies: {
        [COOKIE_ACCESS_TOKEN]: ACCESS_TOKEN
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
        expect(next).not.to.be.called;
        expect(response.clearCookie).to.be.calledWith(COOKIE_ACCESS_TOKEN);
        expect(response.status).to.be.calledWith(204);
        done();
      } catch (e) {
        done(e);
      }
    });

    logoutRoute(request, response, next);
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
