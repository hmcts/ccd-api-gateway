const chai = require('chai');
const expect = chai.expect;
const request = require('supertest');
const app = require('app');

describe('health check', () => {
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
});
