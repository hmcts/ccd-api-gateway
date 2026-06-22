import { expect } from 'chai'
import esmock from 'esmock';

describe('service filter', () => {

  const request = {};
  const reply = {};

  it('should return a 500 error in case of FetchError', async () => {
    const EnotFoundError = () => {
      return Promise.reject({
        name: 'FetchError',
        message: 'some error'
      });
    };

    const serviceFilter = await esmock('../../app/service/service-filter.js',
      {
        '../../app/service/service-token-generator.js': {default : EnotFoundError}
      });

    serviceFilter(request, reply, (error) => {
      expect(error.status).to.equal(500);
      expect(error.error).to.equal('Internal Server Error');
      expect(error.message).to.equal('some error');
      done();
    });
  });

  it('should return a 401 error when s2s call fails with no error status', async () => {
    const ErrorWithNoStatus = () => {
      return Promise.reject({});
    };

    const serviceFilter = await esmock('../../app/service/service-filter.js',
      {
        '../../app/service/service-token-generator.js': ErrorWithNoStatus
      });

    serviceFilter(request, reply, (error) => {
      expect(error.status).to.equal(401);
      done();
    });
  });

  it('should return the error status when s2s call fails with an error status', async () => {
    const ErrorWithStatus = () => {
      return Promise.reject({
        status: 502
      });
    };

    const serviceFilter = await esmock('../../app/service/service-filter.js',
      {
        '../../app/service/service-token-generator.js': ErrorWithStatus
      });

    serviceFilter(request, reply, (error) => {
      expect(error.status).to.equal(502);
      done();
    });
  });


});
