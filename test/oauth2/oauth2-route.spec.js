const chai = require('chai');
const expect = chai.expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const sinonExpressMock = require('sinon-express-mock');
const ACCESS_TOKEN_COOKIE_NAME = require('../../app/oauth2/oauth2-route').COOKIE_ACCESS_TOKEN;
chai.use(sinonChai);

describe('oauth2Route', () => {
  const TOKEN = {
    access_token: 'ey123.ey456',
    expires_in: 3600
  };

  let request;
  let response;
  let next;
  let config;
  let accessTokenRequest;
  let oauth2Route;
  let responseFromPromiseMock;

  beforeEach(() => {

    config = {
      get: sinon.stub()
    };
    responseFromPromiseMock = {
      status: 200,
      json: sinon.stub()
    };

    request = sinonExpressMock.mockReq();
    response = sinonExpressMock.mockRes();
    next = sinon.stub();
    accessTokenRequest = sinon.stub();
    accessTokenRequest.withArgs(request).returns(Promise.resolve(responseFromPromiseMock));

    oauth2Route = proxyquire('../../app/oauth2/oauth2-route', {
      './access-token-request': accessTokenRequest,
      'config': config
    }).oauth2Route;
  });

  it('should set an accessToken cookie with the "secure" flag enabled', done => {

    config.get.withArgs('security.secure_auth_cookie_enabled').returns(true);
    responseFromPromiseMock.json.withArgs().returns(Promise.resolve(TOKEN));

    response.send.callsFake( () => {
      try {

        expect(accessTokenRequest).to.be.calledWith(request);
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
        expect(result).to.eql(expectedError);
        done();
      } catch (e) {
        done(e);
      }
    });

    unauthorizedOauth2Route(request, response, next);
  });
});
