const chai = require('chai');
const expect = chai.expect;
const http = require('http');
const nock = require('nock');
const proxyquire = require('proxyquire');
const request = require('supertest');

const IDAM_URL = 'http://localhost:5000';
const ACCESS_TOKEN = 'endpoint-test-access-token';
const AUTH_CODE = 'endpoint-test-code';
const REDIRECT_URI = 'https://gateway.test/oauth2redirect';

describe('OAuth and logout endpoint integration', () => {
  let app;
  let server;

  before(done => {
    app = proxyquire('../../app.js', {
      './app/user/auth-checker-user-only-filter': {
        authCheckerUserOnlyFilter: (req, res, next) => next()
      }
    });
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', done);
  });

  after(done => server.close(done));

  afterEach(() => {
    if (!nock.isDone()) {
      const pendingMocks = nock.pendingMocks();
      nock.cleanAll();
      chai.assert.fail(`Not all nock interceptors completed: ${pendingMocks.join(', ')}`);
    }
  });

  it('should exchange an authorization code through GET /oauth2', async () => {
    nock(IDAM_URL)
      .post('/oauth2/token')
      .query({
        code: AUTH_CODE,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      })
      .reply(200, {
        access_token: ACCESS_TOKEN,
        expires_in: 3600
      });

    const response = await request(server)
      .get('/oauth2')
      .query({
        code: AUTH_CODE,
        redirect_uri: REDIRECT_URI
      })
      .expect(204);

    expect(response.headers['set-cookie']).to.have.length(1);
    expect(response.headers['set-cookie'][0]).to.include(`accessToken=${ACCESS_TOKEN}`);
    expect(response.headers['set-cookie'][0]).to.include('HttpOnly');
  });

  it('should return 502 when IdAM rejects the token exchange', async () => {
    nock(IDAM_URL)
      .post('/oauth2/token')
      .query({
        code: AUTH_CODE,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      })
      .reply(401, {
        error: 'invalid_grant'
      });

    const response = await request(server)
      .get('/oauth2')
      .query({
        code: AUTH_CODE,
        redirect_uri: REDIRECT_URI
      })
      .expect(502);

    expect(response.body.status).to.equal(502);
    expect(response.body.message).to.equal('Internal Server Error');
    expect(response.headers['set-cookie']).to.be.undefined;
  });

  it('should log out through GET /logout and clear the access-token cookie', async () => {
    nock(IDAM_URL)
      .delete(`/session/${ACCESS_TOKEN}`)
      .reply(204);

    const response = await request(server)
      .get('/logout')
      .set('Cookie', `accessToken=${ACCESS_TOKEN}`)
      .expect(204);

    expect(response.headers['set-cookie']).to.have.length(1);
    expect(response.headers['set-cookie'][0]).to.include('accessToken=;');
  });

  it('should return 400 from GET /logout when the access-token cookie is missing', async () => {
    const response = await request(server)
      .get('/logout')
      .expect(400);

    expect(response.body).to.include({
      error: 'No auth token',
      status: 400,
      message: 'No auth token to log out'
    });
  });
});
