const chai = require('chai');
const expect = chai.expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);

describe('authCheckerUserOnlyFilter', () => {

  const user = {
    uid: '123',
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
    res = {
      status: function(statusInput) {
        this.status = statusInput;
      },
      json: function(jsonInput) {
        this.json = jsonInput;
      }
    };

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
      filter.authCheckerUserOnlyFilter(req, res, error => {
        expect(error).to.be.undefined;
        done();
      });
    });

    it('should set authenticated user in request', done => {
      filter.authCheckerUserOnlyFilter(req, res, () => {
        expect(req.authentication.user).to.equal(user);
        done();
      });
    });

    it('should add user ID as a request header', done => {
      filter.authCheckerUserOnlyFilter(req, res, () => {
        expect(req.headers['user-id']).to.equal(user.uid);
        done();
      });
    });

    it('should add comma separated roles as a request header', done => {
      filter.authCheckerUserOnlyFilter(req, res, () => {
        expect(req.headers['user-roles']).to.equal(user.roles.join(','));
        done();
      });
    });
  });

  describe('when authorisation failed', () => {
    let error;

    it('should call next middleware with error', done => {
      error = {
        name: 'not a FetchError',
        status: 403
      };
      userRequestAuthorizer.authorise.returns(Promise.reject(error));

      filter.authCheckerUserOnlyFilter(req, res, err => {
        expect(err).to.equal(error);
        expect(err.status).to.equal(403);
        done();
      });
    });

    it('should return 500 status code in case of FetchError', done => {
      error = {
        name: 'FetchError',
        message: 'some message',
        status: 403
      };
      userRequestAuthorizer.authorise.returns(Promise.reject(error));

      filter.authCheckerUserOnlyFilter(req, res, error => {
        expect(error.status).to.equal(500);
        expect(error.error).to.equal('Internal Server Error');
        expect(error.message).to.equal('some message');
        done();
      });
    });

    it('should return 502 status code in case of FetchError and error message containing "getaddrinfo ENOTFOUND" and no status', done => {
      error = {
        name: 'FetchError',
        message: 'blah getaddrinfo ENOTFOUND blah'
      };
      userRequestAuthorizer.authorise.returns(Promise.reject(error));

      filter.authCheckerUserOnlyFilter(req, res, error => {
        expect(error.status).to.equal(502);
        expect(error.error).to.equal('Bad Gateway');
        expect(error.message).to.equal('blah getaddrinfo ENOTFOUND blah');
        done();
      });
    });

    it('should return 502 status code in case of FetchError and error message containing "socket hang up" and no status', done => {
      error = {
        name: 'FetchError',
        message: 'blah socket hang up blah'
      };
      userRequestAuthorizer.authorise.returns(Promise.reject(error));

      filter.authCheckerUserOnlyFilter(req, res, error => {
        expect(error.status).to.equal(502);
        expect(error.error).to.equal('Bad Gateway');
        expect(error.message).to.equal('blah socket hang up blah');
        done();
      });
    });

    it('should return 502 status code in case of FetchError and error message containing "socket hang up" and 403 status', done => {
      error = {
        name: 'FetchError',
        message: 'blah socket hang up blah',
        status: 403
      };
      userRequestAuthorizer.authorise.returns(Promise.reject(error));

      filter.authCheckerUserOnlyFilter(req, res, error => {
        expect(error.status).to.equal(502);
        expect(error.error).to.equal('Bad Gateway');
        expect(error.message).to.equal('blah socket hang up blah');
        done();
      });
    });

    it('should return 502 status code in case of FetchError and error message containing "getaddrinfo EAI_AGAIN" and no status', done => {
      error = {
        name: 'FetchError',
        message: 'blah getaddrinfo EAI_AGAIN blah'
      };
      userRequestAuthorizer.authorise.returns(Promise.reject(error));

      filter.authCheckerUserOnlyFilter(req, res, error => {
        expect(error.status).to.equal(502);
        expect(error.error).to.equal('Bad Gateway');
        expect(error.message).to.equal('blah getaddrinfo EAI_AGAIN blah');
        done();
      });
    });

    it('should return 502 status code in case of FetchError and error message containing "connect ETIMEOUT" and no status', done => {
      error = {
        name: 'FetchError',
        message: 'blah connect ETIMEOUT blah'
      };
      userRequestAuthorizer.authorise.returns(Promise.reject(error));

      filter.authCheckerUserOnlyFilter(req, res, error => {
        expect(error.status).to.equal(502);
        expect(error.error).to.equal('Bad Gateway');
        expect(error.message).to.equal('blah connect ETIMEOUT blah');
        done();
      });
    });

    it('should return 502 status code in case of FetchError and error message containing "ECONNRESET" and no status', done => {
      error = {
        name: 'FetchError',
        message: 'blah ECONNRESET blah'
      };
      userRequestAuthorizer.authorise.returns(Promise.reject(error));

      filter.authCheckerUserOnlyFilter(req, res, error => {
        expect(error.status).to.equal(502);
        expect(error.error).to.equal('Bad Gateway');
        expect(error.message).to.equal('blah ECONNRESET blah');
        done();
      });
    });

    it('should return 502 status code in case of FetchError and error message containing "ECONNREFUSED" and no status', done => {
      error = {
        name: 'FetchError',
        message: 'blah ECONNREFUSED blah'
      };
      userRequestAuthorizer.authorise.returns(Promise.reject(error));

      filter.authCheckerUserOnlyFilter(req, res, error => {
        expect(error.status).to.equal(502);
        expect(error.error).to.equal('Bad Gateway');
        expect(error.message).to.equal('blah ECONNREFUSED blah');
        done();
      });
    });

    it('should return 500 status code in case of FetchError and error message is undefined', done => {
      error = {
        name: 'FetchError',
        message: undefined
      };
      userRequestAuthorizer.authorise.returns(Promise.reject(error));

      filter.authCheckerUserOnlyFilter(req, res, error => {
        expect(error.status).to.equal(500);
        expect(error.error).to.equal('Internal Server Error');
        expect(error.message).to.equal(undefined);
        done();
      });
    });


    it('should return 401 status code when idam call fails with no error status', done => {
      error = {};
      userRequestAuthorizer.authorise.returns(Promise.reject(error));

      filter.authCheckerUserOnlyFilter(req, res, error => {
        expect(error.status).to.equal(401);
        done();
      });
    });

    it('should return the error status when idam call fails with an error status', done => {
      error = {
        status: 502
      };
      userRequestAuthorizer.authorise.returns(Promise.reject(error));

      filter.authCheckerUserOnlyFilter(req, res, error => {
        expect(error.status).to.equal(502);
        done();
      });
    });

    it('should return 502 status code in case of FetchError and error message containing "getaddrinfo ENOTFOUND" next undefined', done => {
      error = {
        name: 'FetchError',
        message: 'blah getaddrinfo ENOTFOUND blah'
      };

      // next undefined in function call
      filter.mapFetchErrors(error , res);

      expect(res.status).to.equal(502);
      expect(res.json.error).to.equal('Bad Gateway');
      expect(res.json.message).to.equal('blah getaddrinfo ENOTFOUND blah');
      done();
    });

    it('should return 502 status code in case of FetchError and error message containing "socket hang up" next undefined', done => {
      error = {
        name: 'FetchError',
        message: 'blah socket hang up blah'
      };

      // next undefined in function call
      filter.mapFetchErrors(error , res);

      expect(res.status).to.equal(502);
      expect(res.json.error).to.equal('Bad Gateway');
      expect(res.json.message).to.equal('blah socket hang up blah');
      done();
    });

    it('should return 502 status code in case of FetchError and error message containing "getaddrinfo EAI_AGAIN" next undefined', done => {
      error = {
        name: 'FetchError',
        message: 'blah getaddrinfo EAI_AGAIN blah'
      };

      // next undefined in function call
      filter.mapFetchErrors(error , res);

      expect(res.status).to.equal(502);
      expect(res.json.error).to.equal('Bad Gateway');
      expect(res.json.message).to.equal('blah getaddrinfo EAI_AGAIN blah');
      done();
      });

    it('should return 502 status code in case of FetchError and error message containing "connect ETIMEOUT" next undefined', done => {
      error = {
        name: 'FetchError',
        message: 'blah connect ETIMEOUT blah'
      };

      // next undefined in function call
      filter.mapFetchErrors(error , res);

      expect(res.status).to.equal(502);
      expect(res.json.error).to.equal('Bad Gateway');
      expect(res.json.message).to.equal('blah connect ETIMEOUT blah');
      done();
    });

    it('should return 502 status code in case of FetchError and error message containing "ECONNRESET" next undefined', done => {
      error = {
        name: 'FetchError',
        message: 'blah ECONNRESET blah'
      };

      // next undefined in function call
      filter.mapFetchErrors(error , res);

      expect(res.status).to.equal(502);
      expect(res.json.error).to.equal('Bad Gateway');
      expect(res.json.message).to.equal('blah ECONNRESET blah');
      done();
    });

    it('should return 502 status code in case of FetchError and error message containing "ECONNREFUSED" next undefined', done => {
      error = {
        name: 'FetchError',
        message: 'blah ECONNREFUSED blah'
      };

      // next undefined in function call
      filter.mapFetchErrors(error , res);

      expect(res.status).to.equal(502);
      expect(res.json.error).to.equal('Bad Gateway');
      expect(res.json.message).to.equal('blah ECONNREFUSED blah');
      done();

    });


    it('should return 500 status code in case of FetchError non matching error message and next undefined', done => {
      error = {
        name: 'FetchError',
        message: 'some message',
        status: 403
      };

      // next undefined in function call
      filter.mapFetchErrors(error , res);

      expect(res.status).to.equal(500);
      expect(res.json.error).to.equal('Error when connecting to remote server');
      expect(res.json.status).to.equal(504);
      expect(res.json.message).to.equal('some message');
      done();
    });

    it('should return 500 status code in case of FetchError non matching error message undefined and next undefined', done => {
      error = {
        name: 'FetchError',
        status: 403
      };

      // next undefined in function call
      filter.mapFetchErrors(error , res);

      expect(res.status).to.equal(500);
      expect(res.json.error).to.equal('Error when connecting to remote server');
      expect(res.json.status).to.equal(504);
      expect(res.json.message).to.equal(undefined);
      done();
    });


  });
});
