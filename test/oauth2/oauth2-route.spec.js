const chai = require('chai');
const expect = chai.expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const sinonExpressMock = require('sinon-express-mock');
const ACCESS_TOKEN_COOKIE_NAME = require('../../app/oauth2/oauth2-route').COOKIE_ACCESS_TOKEN;
const OAUTH2_STATE_COOKIE_NAME = require('../../app/oauth2/oauth2-route').COOKIE_OAUTH2_STATE;
chai.use(sinonChai);

describe('oauth2Route', () => {
  const TOKEN = {
    access_token: 'ey123.ey456',
    expires_in: 3600
  };
  const STATE = 'generated-state';

  let request;
  let response;
  let next;
  let config;
  let accessTokenRequest;
  let oauth2Route;
  let oauth2StateRoute;
  let responseFromPromiseMock;
  let randomBytes;

  beforeEach(() => {

    config = {
      get: sinon.stub()
    };
    randomBytes = sinon.stub().returns({
      toString: sinon.stub().withArgs('hex').returns(STATE)
    });
    responseFromPromiseMock = {
      status: 200,
      json: sinon.stub()
    };

    request = sinonExpressMock.mockReq();
    request.query = {
      state: STATE
    };
    request.cookies = {
      [OAUTH2_STATE_COOKIE_NAME]: STATE
    };
    response = sinonExpressMock.mockRes();
    next = sinon.stub();
    accessTokenRequest = sinon.stub();
    accessTokenRequest.withArgs(request).returns(Promise.resolve(responseFromPromiseMock));

    const oauth2Module = proxyquire('../../app/oauth2/oauth2-route', {
      './access-token-request': accessTokenRequest,
      'config': config,
      'crypto': {
        randomBytes
      }
    });

    oauth2Route = oauth2Module.oauth2Route;
    oauth2StateRoute = oauth2Module.oauth2StateRoute;
  });

  it('should issue an oauth2 state cookie and return the state', () => {

    config.get.withArgs('security.secure_auth_cookie_enabled').returns(true);

    oauth2StateRoute(request, response);

    expect(response.cookie).to.be.calledWith(OAUTH2_STATE_COOKIE_NAME, STATE,
      { maxAge: 5 * 60 * 1000, httpOnly: true, sameSite: 'lax', secure: true });
    expect(response.status).to.be.calledWith(200);
    expect(response.json).to.be.calledWith({ state: STATE });
  });

  it('should issue an oauth2 state cookie with the "secure" flag disabled', () => {

    config.get.withArgs('security.secure_auth_cookie_enabled').returns(false);

    oauth2StateRoute(request, response);

    expect(response.cookie).to.be.calledWith(OAUTH2_STATE_COOKIE_NAME, STATE,
      { maxAge: 5 * 60 * 1000, httpOnly: true, sameSite: 'lax', secure: false });
    expect(response.status).to.be.calledWith(200);
    expect(response.json).to.be.calledWith({ state: STATE });
  });

  it('should set an accessToken cookie with the "secure" flag enabled', done => {

    config.get.withArgs('security.secure_auth_cookie_enabled').returns(true);
    responseFromPromiseMock.json.withArgs().returns(Promise.resolve(TOKEN));

    response.send.callsFake( () => {
      try {

        expect(accessTokenRequest).to.be.calledWith(request);
        expect(response.clearCookie).to.be.calledWith(OAUTH2_STATE_COOKIE_NAME);
        expect(config.get).to.be.calledWith('security.secure_auth_cookie_enabled');
        expect(response.cookie).to.be.calledWith(ACCESS_TOKEN_COOKIE_NAME, TOKEN.access_token,
          { maxAge: TOKEN.expires_in * 1000, httpOnly: true, secure: true });
        expect(response.status).to.be.calledWith(204);
        done();
      } catch (e) {
        done(e);
      }
    });

    oauth2Route(request, response, next);
  });

  it('should set an accessToken cookie with the "secure" flag disabled', done => {

    config.get.withArgs('security.secure_auth_cookie_enabled').returns(false);
    responseFromPromiseMock.json.withArgs().returns(Promise.resolve(TOKEN));

    response.send.callsFake(() => {
      try {
        expect(accessTokenRequest).to.be.calledWith(request);
        expect(response.clearCookie).to.be.calledWith(OAUTH2_STATE_COOKIE_NAME);
        expect(config.get).to.be.calledWith('security.secure_auth_cookie_enabled');
        expect(response.cookie).to.be.calledWith(ACCESS_TOKEN_COOKIE_NAME, TOKEN.access_token,
          { maxAge: TOKEN.expires_in * 1000, httpOnly: true, secure: false });
        expect(response.status).to.be.calledWith(204);
        done();
      } catch (e) {
        done(e);
      }
    });

    oauth2Route(request, response, next);
  });

  it('should fail to obation an accessToken dude to unauthorized request.', done => {

    let expectedError = {
      status: 502,
      message: 'Internal Server Error'
    };

    let  unauthorizedAccessTokenRequest = sinon.stub();
    unauthorizedAccessTokenRequest.withArgs(request).returns(Promise.resolve(expectedError));

    let unauthorizedOauth2Route = proxyquire('../../app/oauth2/oauth2-route', {
      './access-token-request': unauthorizedAccessTokenRequest,
      'config': config
    }).oauth2Route;

    next.callsFake((result) => {
      try {

        expect(unauthorizedAccessTokenRequest).to.be.calledWith(request);
        expect(response.clearCookie).to.be.calledWith(OAUTH2_STATE_COOKIE_NAME);
        expect(result).to.eql(expectedError);
        done();
      } catch (e) {
        done(e);
      }
    });

    unauthorizedOauth2Route(request, response, next);
  });

  it('should reject the callback when the oauth2 state is missing', () => {

    request.query = {};

    oauth2Route(request, response, next);

    expect(accessTokenRequest).not.to.have.been.called;
    expect(response.clearCookie).not.to.have.been.called;
    expect(next).to.have.been.calledWith({
      error: 'Invalid OAuth2 state',
      status: 400,
      message: 'Invalid OAuth2 state parameter'
    });
  });

  it('should reject the callback when the oauth2 state does not match the cookie', () => {

    request.query.state = 'different-state';

    oauth2Route(request, response, next);

    expect(accessTokenRequest).not.to.have.been.called;
    expect(response.clearCookie).not.to.have.been.called;
    expect(next).to.have.been.calledWith({
      error: 'Invalid OAuth2 state',
      status: 400,
      message: 'Invalid OAuth2 state parameter'
    });
  });

  it('should reject the callback when the oauth2 state cookie is missing', () => {

    request.cookies = {};

    oauth2Route(request, response, next);

    expect(accessTokenRequest).not.to.have.been.called;
    expect(response.clearCookie).not.to.have.been.called;
    expect(next).to.have.been.calledWith({
      error: 'Invalid OAuth2 state',
      status: 400,
      message: 'Invalid OAuth2 state parameter'
    });
  });

  it('should reject the callback when query is missing from the request', () => {

    request.query = undefined;

    oauth2Route(request, response, next);

    expect(accessTokenRequest).not.to.have.been.called;
    expect(response.clearCookie).not.to.have.been.called;
    expect(next).to.have.been.calledWith({
      error: 'Invalid OAuth2 state',
      status: 400,
      message: 'Invalid OAuth2 state parameter'
    });
  });

  it('should reject the callback when cookies are missing from the request', () => {

    request.cookies = undefined;

    oauth2Route(request, response, next);

    expect(accessTokenRequest).not.to.have.been.called;
    expect(response.clearCookie).not.to.have.been.called;
    expect(next).to.have.been.calledWith({
      error: 'Invalid OAuth2 state',
      status: 400,
      message: 'Invalid OAuth2 state parameter'
    });
  });
});
