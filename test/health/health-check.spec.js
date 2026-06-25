const chai = require('chai');
const expect = chai.expect;
const request = require('supertest');
const app = require('app');
const config = require('config');
const mock = require('nock');

const idamApiBaseUrl = config.get('idam.base_url');
const s2sAuthServiceBaseUrl = config.get('idam.s2s_url');

describe('health check', () => {

  beforeEach(() => {
    mock(idamApiBaseUrl).get('/health').reply(200, { status: 'UP' });
    mock(s2sAuthServiceBaseUrl).get('/health').reply(200, { status: 'UP' });
  });

  afterEach(() => {
    mock.cleanAll();
  });

  it('should return health check status with 200 OK for default domain URL', async () => {
    await request(app)
      .get('/')
      .expect(res => {
        expect(res.status).equal(200);
        expect(res.body.status).equal('UP');
      });
  });

  it('should return 200 OK for health check', async () => {
    await request(app)
      .get('/health')
      .expect(res => {
        expect(res.status).equal(200);
        expect(res.body.status).equal('UP');
      });
  });

  it('should return 200 OK for liveness health check', async () => {
    await request(app)
    .get('/health/liveness')
    .expect(res => {
      expect(res.status).equal(200);
      expect(res.body.status).equal('UP');
    });
  });

  it('should return 200 OK for readiness health check', async () => {
    await request(app)
    .get('/health/readiness')
    .expect(res => {
      expect(res.status).equal(200);
      expect(res.body.status).equal('UP');
    });
  });
});
