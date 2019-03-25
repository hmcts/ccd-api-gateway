const chai = require('chai');
const expect = chai.expect;
const request = require('supertest');
const app = require('app');

describe('Liveness', () => {
  it('should return 200 OK', async () => {
    await request(app)
    .get('/health/liveness')
    .expect(res => {
      expect(res.status).equal(200);
      expect(res.body.status).equal('UP');
    });
  });
});
