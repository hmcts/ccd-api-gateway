const chai = require('chai');
const expect = chai.expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);

describe('authCheckerUserOnlyFilter', () => {

  const user = {
    id: '123',
    roles: ['r1', 'r2']
  };

  let req;
  let res;
  let userRequestAuthorizer;
  let filter;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {};

    userRequestAuthorizer = {
      authorise: sinon.stub()
    };

    filter = proxyquire('../../app/user/auth-checker-user-only-filter', {
      './user-request-authorizer': userRequestAuthorizer
    });
  });

  describe('when user authorised', () => {
    beforeEach(() => {
      userRequestAuthorizer.authorise.returns(Promise.resolve(user));
    });

    it('should call next middleware without error', done => {
      filter(req, res, error => {
        expect(error).to.be.undefined;
        done();
      });
    });

    it('should set authenticated user in request', done => {
      filter(req, res, () => {
        expect(req.authentication.user).to.equal(user);
        done();
      });
    });

    it('should add user ID as a request header', done => {
      filter(req, res, () => {
        expect(req.headers['user-id']).to.equal(user.id);
        done();
      });
    });

    it('should add comma separated roles as a request header', done => {
      filter(req, res, () => {
        expect(req.headers['user-roles']).to.equal(user.roles.join(','));
        done();
      });
    });
  });

  describe('when authorisation failed', () => {
    let error;

    it('should call next middleware with error', done => {
      error = {
        name: 'FetchError',
        status: 403
      };
      userRequestAuthorizer.authorise.returns(Promise.reject(error));

      filter(req, res, error => {
        expect(error).to.equal(error);
        done();
      });
    });

    it('should return 500 status code in case of FetchError', done => {
      error = {
        name: 'FetchError',
        status: 403
      };
      userRequestAuthorizer.authorise.returns(Promise.reject(error));

      filter(req, res, error => {
        expect(error.status).to.equal(500);
        expect(error.error).to.equal('Internal Server Error');
        expect(error.message).to.equal('Something went wrong when calling IDAM');
        done();
      });
    });

    it('should return 401 status code when idam call fails with no error status', done => {
      error = {};
      userRequestAuthorizer.authorise.returns(Promise.reject(error));

      filter(req, res, error => {
        expect(error.status).to.equal(401);
        done();
      });
    });

    it('should return the error status when idam call fails with an error status', done => {
      error = {
        status: 502
      };
      userRequestAuthorizer.authorise.returns(Promise.reject(error));

      filter(req, res, error => {
        expect(error.status).to.equal(502);
        done();
      });
    });
  });

});
