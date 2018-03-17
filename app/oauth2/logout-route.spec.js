const chai = require('chai');
const expect = chai.expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const sinonExpressMock = require('sinon-express-mock');
const COOKIE_ACCESS_TOKEN = require('./oauth2-route').COOKIE_ACCESS_TOKEN;
const url = require('url');
chai.use(sinonChai);

describe('logoutRoute', () => {
  const ACCESS_TOKEN = 'eycdjc7hf3478g4f37';
  const LOGOUT_URL = 'http://idam.reform.hmcts.net/login/logout';

  let request;
  let response;
  let next;
  let config;
  let logoutRoute;

  beforeEach(() => {
    config = {
      get: sinon.stub()
    };
    config.get.withArgs('idam.logout_url').returns(LOGOUT_URL);

    request = sinonExpressMock.mockReq({
      cookies: {
        [COOKIE_ACCESS_TOKEN]: ACCESS_TOKEN
      }
    });
    response = sinonExpressMock.mockRes({});
    next = sinon.stub();


    logoutRoute = proxyquire('./logout-route', {
      'config': config,
    }).logoutRoute;
  });

  it('should redirect to logout URL with JWT token', () => {
    logoutRoute(request, response, next);

    expect(response.redirect).to.be.calledWith(`${LOGOUT_URL}?jwt=${ACCESS_TOKEN}`);
    expect(next).not.to.be.called;
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
