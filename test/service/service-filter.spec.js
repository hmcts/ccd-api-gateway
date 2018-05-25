const proxyquire = require('proxyquire');
const chai = require('chai');
const expect = chai.expect;

describe('service filter', () => {

  const request = {};
  const reply = {};

  it('should return a 500 error when problems connecting to s2s service', done => {

    const EnotFoundError = () => {
      return Promise.reject({
        errno: 'ENOTFOUND'
      });
    };

    const serviceFilter = proxyquire('../../app/service/service-filter',
      {
        './service-token-generator': EnotFoundError
      });

      serviceFilter(request, reply, (error) => {
        expect(error.status).to.equal(500);
        expect(error.error).to.equal('Internal Server Error');
        expect(error.message).to.equal('Some error happened while calling S2S token generation');
        done();
      });
  });

  it('should return a 401 error when s2s call fails with no error status', done => {
    const ErrorWithNoStatus = () => {
      return Promise.reject({});
    };

    const serviceFilter = proxyquire('../../app/service/service-filter',
      {
        './service-token-generator': ErrorWithNoStatus
      });

      serviceFilter(request, reply, (error) => {
        expect(error.status).to.equal(401);
        done();
      });
  });

  it('should return the error status when s2s call fails with an error status', done => {
    const ErrorWithStatus = () => {
      return Promise.reject({
        status: 502
      });
    };

    const serviceFilter = proxyquire('../../app/service/service-filter',
      {
        './service-token-generator': ErrorWithStatus
      });

      serviceFilter(request, reply, (error) => {
        expect(error.status).to.equal(502);
        done();
      });
  });


});
