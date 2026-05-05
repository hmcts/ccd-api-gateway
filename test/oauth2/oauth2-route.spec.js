const chai = require('chai');
const expect = chai.expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const sinonExpressMock = require('sinon-express-mock');

const ACCESS_TOKEN_COOKIE_NAME =
  require('../../app/oauth2/oauth2-route').COOKIE_ACCESS_TOKEN;

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

    request = sinonExpressMock.mockReq();
    response = sinonExpressMock.mockRes();
    next = sinon.stub();

    responseFromPromiseMock = {
      status: 200,
      json: sinon.stub()
    };

    accessTokenRequest = sinon.stub();
    accessTokenRequest.withArgs(request)
      .returns(Promise.resolve(responseFromPromiseMock));

    oauth2Route = proxyquire('../../app/oauth2/oauth2-route', {
      './access-token-request': accessTokenRequest,
      config
    }).oauth2Route;
  });

  it('should set accessToken cookie with secure flag enabled', (done) => {

    config.get.withArgs('security.secure_auth_cookie_enabled').returns(true);
    responseFromPromiseMock.json.returns(Promise.resolve(TOKEN));

    response.status.callsFake(() => response);
    response.send.callsFake(() => {
      try {
        expect(accessTokenRequest).to.have.been.calledWith(request);
        expect(config.get).to.have.been.calledWith('security.secure_auth_cookie_enabled');

        expect(response.cookie).to.have.been.calledWith(
          ACCESS_TOKEN_COOKIE_NAME,
          TOKEN.access_token,
          {
            maxAge: TOKEN.expires_in * 1000,
            httpOnly: true,
            secure: true,
            sameSite: 'Lax'
          }
        );

        expect(response.status).to.have.been.calledWith(204);

        done();
      } catch (err) {
        done(err);
      }
    });

    oauth2Route(request, response, next);
  });

  it('should set accessToken cookie with secure flag disabled', (done) => {

    config.get.withArgs('security.secure_auth_cookie_enabled').returns(false);
    responseFromPromiseMock.json.returns(Promise.resolve(TOKEN));

    response.status.callsFake(() => response);
    response.send.callsFake(() => {
      try {
        expect(response.cookie).to.have.been.calledWith(
          ACCESS_TOKEN_COOKIE_NAME,
          TOKEN.access_token,
          {
            maxAge: TOKEN.expires_in * 1000,
            httpOnly: true,
            secure: false,
            sameSite: 'Lax'
          }
        );

        expect(response.status).to.have.been.calledWith(204);
        done();
      } catch (err) {
        done(err);
      }
    });

    oauth2Route(request, response, next);
  });

  it('should call next with error when token request fails', (done) => {

    const expectedError = {
      status: 502,
      message: 'Internal Server Error'
    };

    const failingRequest = sinon.stub()
      .withArgs(request)
      .returns(Promise.resolve(expectedError));

    const failingRoute = proxyquire('../../app/oauth2/oauth2-route', {
      './access-token-request': failingRequest,
      config
    }).oauth2Route;

    next.callsFake((err) => {
      try {
        expect(failingRequest).to.have.been.calledWith(request);
        expect(err).to.eql(expectedError);
        done();
      } catch (e) {
        done(e);
      }
    });

    failingRoute(request, response, next);
  });

});
