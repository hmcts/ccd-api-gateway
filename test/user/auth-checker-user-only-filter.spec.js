const chai = require('chai');
const expect = chai.expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const sinonExpressMock = require('sinon-express-mock');

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
    req = sinonExpressMock.mockReq({});
    res = sinonExpressMock.mockRes({});

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
  });

  describe('when authorisation failed', () => {
    let error;

    beforeEach(() => {
      error = {
        status: 403
      };

      userRequestAuthorizer.authorise.returns(Promise.reject(error));
    });

    it('should call next middleware with error', done => {
      filter(req, res, error => {
        expect(error).to.equal(error);
        done();
      });
    });
  });

});
