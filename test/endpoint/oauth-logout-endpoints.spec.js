const chai = require('chai');
const expect = chai.expect;
const http = require('http');
const nock = require('nock');
const proxyquire = require('proxyquire');
const request = require('supertest');
const sinon = require('sinon');
const { OAUTH_STATE_TTL_MS } = require('../../app/oauth2/oauth-state');

const IDAM_URL = 'http://test-idam:1234';
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
      .post('/o/token')
      .query({
        code: AUTH_CODE,
        client_id: 'ccd_gateway',
        client_secret: 'ccd_gateway_secret',
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      })
      .reply(200, {
        access_token: ACCESS_TOKEN,
        expires_in: 3600
      });

    const stateResponse = await request(server).get('/oauth2/state').expect(200);
    const response = await request(server)
      .get('/oauth2')
      .set('Cookie', stateResponse.headers['set-cookie'].map(cookie => cookie.split(';')[0]))
      .query({
        code: AUTH_CODE,
        redirect_uri: REDIRECT_URI,
        state: stateResponse.body.state
      })
      .expect(204);

    expect(response.headers['set-cookie']).to.have.length(2);
    expect(response.headers['set-cookie'][0]).to.include(`oauth2State_${stateResponse.body.state}=;`);
    expect(response.headers['set-cookie'][1]).to.include(`accessToken=${ACCESS_TOKEN}`);
    expect(response.headers['set-cookie'][1]).to.include('HttpOnly');
  });

  it('should return 502 when IdAM rejects the token exchange', async () => {
    nock(IDAM_URL)
      .post('/o/token')
      .query({
        code: AUTH_CODE,
        client_id: 'ccd_gateway',
        client_secret: 'ccd_gateway_secret',
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      })
      .reply(401, {
        error: 'invalid_grant'
      });

    const stateResponse = await request(server).get('/oauth2/state').expect(200);
    const response = await request(server)
      .get('/oauth2')
      .set('Cookie', stateResponse.headers['set-cookie'].map(cookie => cookie.split(';')[0]))
      .query({
        code: AUTH_CODE,
        redirect_uri: REDIRECT_URI,
        state: stateResponse.body.state
      })
      .expect(502);

    expect(response.body.status).to.equal(502);
    expect(response.body.message).to.equal('Internal Server Error');
    expect(response.headers['set-cookie']).to.have.length(1);
    expect(response.headers['set-cookie'][0]).to.include(`oauth2State_${stateResponse.body.state}=;`);
    await request(server).get('/oauth2')
      .set('Cookie', stateResponse.headers['set-cookie'].map(cookie => cookie.split(';')[0]))
      .query({ state: stateResponse.body.state, code: AUTH_CODE, redirect_uri: REDIRECT_URI }).expect(400);
  });

  it('should reject concurrent replay before exchanging the code a second time', async () => {
    const issued = await request(server).get('/oauth2/state').expect(200);
    const cookie = issued.headers['set-cookie'].map(value => value.split(';')[0]);
    nock(IDAM_URL).post('/o/token').query(true)
      .delay(20).reply(200, { access_token: ACCESS_TOKEN, expires_in: 3600 });

    const responses = await Promise.all([0, 1].map(() => request(server).get('/oauth2')
      .set('Cookie', cookie)
      .query({ state: issued.body.state, code: AUTH_CODE, redirect_uri: REDIRECT_URI })));

    expect(responses.map(response => response.status).sort()).to.deep.equal([204, 400]);
    await request(server).get('/oauth2').set('Cookie', cookie)
      .query({ state: issued.body.state, code: AUTH_CODE, redirect_uri: REDIRECT_URI }).expect(400);
  });

  for (const reverseOrder of [false, true]) {
    it(`should complete parallel logins in ${reverseOrder ? 'reverse' : 'original'} order`, async () => {
      // Distinct cookie names also support simultaneous initiations in a fresh browser.
      const issued = await Promise.all([0, 1].map(() => request(server).get('/oauth2/state').expect(200)));
      const cookies = issued.map(response => response.headers['set-cookie'][0].split(';')[0]);
      expect(cookies[0].split('=')[0]).not.to.equal(cookies[1].split('=')[0]);
      for (const initiation of reverseOrder ? [...issued].reverse() : issued) {
        nock(IDAM_URL).post('/o/token').query(true)
          .reply(200, { access_token: ACCESS_TOKEN, expires_in: 3600 });
        const response = await request(server).get('/oauth2').set('Cookie', cookies)
          .query({ state: initiation.body.state, code: AUTH_CODE, redirect_uri: REDIRECT_URI }).expect(204);
        const cleared = response.headers['set-cookie'].filter(cookie => cookie.startsWith('oauth2State_'));
        expect(cleared).to.have.length(1);
        expect(cleared[0]).to.include(`oauth2State_${initiation.body.state}=;`);
      }
    });
  }

  it('should reject an expired state using the original browser cookies', async () => {
    const issued = await request(server).get('/oauth2/state').expect(200);
    const cookies = issued.headers['set-cookie'].map(cookie => cookie.split(';')[0]);
    const now = Date.now();
    const clock = sinon.stub(Date, 'now').returns(now + OAUTH_STATE_TTL_MS);
    try {
      await request(server).get('/oauth2').set('Cookie', cookies)
        .query({ state: issued.body.state, code: AUTH_CODE, redirect_uri: REDIRECT_URI }).expect(400);
    } finally {
      clock.restore();
    }
  });

  it('should reject repeated state parameters without consuming the valid transaction', async () => {
    const issued = await request(server).get('/oauth2/state').expect(200);
    const cookies = issued.headers['set-cookie'].map(cookie => cookie.split(';')[0]);
    await request(server).get('/oauth2').set('Cookie', cookies)
      .query({ state: [issued.body.state, issued.body.state] }).expect(400);

    nock(IDAM_URL).post('/o/token').query(true)
      .reply(200, { access_token: ACCESS_TOKEN, expires_in: 3600 });
    await request(server).get('/oauth2').set('Cookie', cookies)
      .query({ state: issued.body.state, code: AUTH_CODE, redirect_uri: REDIRECT_URI }).expect(204);
  });

  it('should reject state from a different browser without consuming the legitimate transaction', async () => {
    const first = await request(server).get('/oauth2/state').expect(200);
    const second = await request(server).get('/oauth2/state').expect(200);
    await request(server).get('/oauth2')
      .set('Cookie', second.headers['set-cookie'][0].split(';')[0])
      .query({ state: first.body.state }).expect(400);
    nock(IDAM_URL).post('/o/token').query(true)
      .reply(200, { access_token: ACCESS_TOKEN, expires_in: 3600 });
    await request(server).get('/oauth2')
      .set('Cookie', first.headers['set-cookie'][0].split(';')[0])
      .query({ state: first.body.state, code: AUTH_CODE, redirect_uri: REDIRECT_URI }).expect(204);
  });

  it('should log out through GET /logout and clear the access-token cookie', async () => {
    nock(IDAM_URL)
      .get('/o/endSession')
      .query({ token: ACCESS_TOKEN })
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
