import * as chai from 'chai';
// import { expect } from 'chai';
import esmock from 'esmock';
const expect = chai.expect;
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import sinonExpressMock from 'sinon-express-mock';
import {COOKIE_ACCESS_TOKEN} from '../../app/oauth2/oauth2-route.js';
const assert = sinon.assert;
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

  beforeEach(async () => {

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

    const oauth2Module = await esmock('../../app/oauth2/oauth2-route.js', {
      '../../app/oauth2/access-token-request.js': { default: accessTokenRequest },
      'config': { default: config }
    });
    oauth2Route = oauth2Module.oauth2Route;
  });

  it('should set an accessToken cookie with the "secure" flag enabled', done => {

    config.get.withArgs('security.secure_auth_cookie_enabled').returns(true);
    responseFromPromiseMock.json.withArgs().returns(Promise.resolve(TOKEN));

    response.send.callsFake( () => {
      try {

        assert.calledWith(accessTokenRequest, request);
        assert.calledWith(config.get, 'security.secure_auth_cookie_enabled');
        assert.calledWith(response.cookie, COOKIE_ACCESS_TOKEN, TOKEN.access_token,
          { maxAge: TOKEN.expires_in * 1000, httpOnly: true, secure: true });
        assert.calledWith(response.status, 204);
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
        assert.calledWith(accessTokenRequest, request);
        assert.calledWith(config.get, 'security.secure_auth_cookie_enabled');
        assert.calledWith(response.cookie, COOKIE_ACCESS_TOKEN, TOKEN.access_token,
          { maxAge: TOKEN.expires_in * 1000, httpOnly: true, secure: false });
        assert.calledWith(response.status, 204);
        done();
      } catch (e) {
        done(e);
      }
    });

    oauth2Route(request, response, next);
  });

  it('should fail to obation an accessToken dude to unauthorized request.', async done => {

    let expectedError = {
      status: 502,
      message: 'Internal Server Error'
    };

    let unauthorizedAccessTokenRequest = sinon.stub();
    unauthorizedAccessTokenRequest.withArgs(request).returns(Promise.resolve(expectedError));

    const unauthorizedOauth2Module = await esmock('../../app/oauth2/oauth2-route.js', {
      './access-token-request.js': { default: unauthorizedAccessTokenRequest },
      'config': { default: config }
    });
    const unauthorizedOauth2Route = unauthorizedOauth2Module.oauth2Route;

    next.callsFake((result) => {
      try {

        assert.calledWith(unauthorizedAccessTokenRequest, request);
        expect(result).to.deep.equal(expectedError);
        done();
      } catch (e) {
        done(e);
      }
    });

    unauthorizedOauth2Route(request, response, next);
  });
});
