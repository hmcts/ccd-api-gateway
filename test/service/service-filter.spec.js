const proxyquire = require('proxyquire');
const chai = require('chai');
const expect = chai.expect;

describe('service filter', () => {

  const request = {};
  const reply = {};

  it('should return a 500 error in case of FetchError', done => {
    const EnotFoundError = () => {
      return Promise.reject({
        name: 'FetchError'
      });
    };

    const serviceFilter = proxyquire('../../app/service/service-filter',
      {
        './service-token-generator': EnotFoundError
      });

      serviceFilter(request, reply, (error) => {
        expect(error.status).to.equal(500);
        expect(error.error).to.equal('Internal Server Error');
        expect(error.message).to.equal('Something went wrong when calling S2S token service');
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
