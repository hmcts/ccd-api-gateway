const chai = require('chai');
const { URL } = require('url');
const expect = chai.expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const sinonExpressMock = require('sinon-express-mock');

chai.use(sinonChai);

describe('loginRoute', () => {
  const AUTHORIZATION_ENDPOINT = 'https://idam.platform.hmcts.net/o/oauth2/auth';
  const CLIENT_ID = 'ccd_gateway';

  let config;
  let randomBytes;
  let loginRoute;

  beforeEach(() => {
    config = {
      get: sinon.stub()
    };
    randomBytes = sinon.stub();

    config.get.withArgs('idam.oauth2.authorization_endpoint').returns(AUTHORIZATION_ENDPOINT);
    config.get.withArgs('idam.oauth2.client_id').returns(CLIENT_ID);

    loginRoute = proxyquire('../../app/oauth2/login-route', {
      config,
      crypto: { randomBytes }
    }).loginRoute;
  });

  it('should generate a state token, persist it in the session and redirect to the IDAM authorization endpoint', () => {
    const expectedState = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    const request = sinonExpressMock.mockReq({
      protocol: 'https',
      session: {}
    });
    const response = sinonExpressMock.mockRes();

    request.get = sinon.stub().withArgs('host').returns('gateway.platform.hmcts.net:8443');
    randomBytes.withArgs(32).returns(Buffer.from(expectedState, 'hex'));

    loginRoute(request, response);

    expect(randomBytes).to.have.been.calledOnce;
    expect(randomBytes).to.have.been.calledWithExactly(32);
    expect(request.session.oauthState).to.equal(expectedState);
    expect(request.session.oauthState).to.match(/^[a-f0-9]{64}$/);
    expect(request.get).to.have.been.calledOnce;
    expect(request.get).to.have.been.calledWithExactly('host');
    expect(config.get).to.have.been.calledWith('idam.oauth2.authorization_endpoint');
    expect(config.get).to.have.been.calledWith('idam.oauth2.client_id');
    expect(response.redirect).to.have.been.calledOnce;

    const [statusCode, location] = response.redirect.firstCall.args;
    const redirectUrl = new URL(location);

    expect(statusCode).to.equal(302);
    expect(`${redirectUrl.origin}${redirectUrl.pathname}`).to.equal(AUTHORIZATION_ENDPOINT);
    expect(redirectUrl.searchParams.get('response_type')).to.equal('code');
    expect(redirectUrl.searchParams.get('client_id')).to.equal(CLIENT_ID);
    expect(redirectUrl.searchParams.get('redirect_uri')).to.equal('https://gateway.platform.hmcts.net:8443/oauth2');
    expect(redirectUrl.searchParams.get('state')).to.equal(expectedState);
  });

  it('should create a fresh state for every request and overwrite any stale session value', () => {
    const firstState = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const secondState = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    const firstRequest = sinonExpressMock.mockReq({
      protocol: 'http',
      session: { oauthState: 'stale-state' }
    });
    const secondRequest = sinonExpressMock.mockReq({
      protocol: 'https',
      session: { oauthState: 'older-state' }
    });
    const firstResponse = sinonExpressMock.mockRes();
    const secondResponse = sinonExpressMock.mockRes();

    firstRequest.get = sinon.stub().withArgs('host').returns('localhost:3000');
    secondRequest.get = sinon.stub().withArgs('host').returns('signin.platform.hmcts.net');
    randomBytes.onFirstCall().returns(Buffer.from(firstState, 'hex'));
    randomBytes.onSecondCall().returns(Buffer.from(secondState, 'hex'));

    loginRoute(firstRequest, firstResponse);
    loginRoute(secondRequest, secondResponse);

    expect(randomBytes).to.have.been.calledTwice;
    expect(firstRequest.session.oauthState).to.equal(firstState);
    expect(secondRequest.session.oauthState).to.equal(secondState);

    const firstRedirect = new URL(firstResponse.redirect.firstCall.args[1]);
    const secondRedirect = new URL(secondResponse.redirect.firstCall.args[1]);

    expect(firstRedirect.searchParams.get('state')).to.equal(firstState);
    expect(firstRedirect.searchParams.get('redirect_uri')).to.equal('http://localhost:3000/oauth2');
    expect(secondRedirect.searchParams.get('state')).to.equal(secondState);
    expect(secondRedirect.searchParams.get('redirect_uri')).to.equal('https://signin.platform.hmcts.net/oauth2');
  });
});

