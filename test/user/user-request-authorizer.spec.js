const proxyquire =  require('proxyquire');
const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;
const sinonChai = require('sinon-chai');
chai.use(sinonChai);
const userReqAuth = require('../../app/user/user-request-authorizer');
const COOKIE_ACCESS_TOKEN = require('../../app/oauth2/oauth2-route').COOKIE_ACCESS_TOKEN;

describe('UserRequestAuthorizer', () => {
  describe('authorize', () => {

    const AUTHZ_HEADER = 'Bearer cincwuewncew.cewnuceuncwe.cewucwbeu';
    const USER_ID = '1';
    const ROLE_1 = 'role1';
    const DETAILS = {
      uid: USER_ID,
      roles: [ROLE_1]
    };
    const COOKIES = {
      [COOKIE_ACCESS_TOKEN]: 'eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIxNW91NWFi'
    };
    const X_CUSTOM_HEADER = 'CCD';

    let request;
    let userResolver;
    let authorizedRolesExtractor;

    let userRequestAuthorizer;

    beforeEach(() => {
      request = {
        url: 'http://caseworkers/:uid/more/stuff',
        originalUrl: 'http://caseworkers/:uid/more/stuff',
        get: sinon.stub().returns(AUTHZ_HEADER),
        cookies: COOKIES
      };
      userResolver = {
        getUserDetails: sinon.stub().returns(Promise.resolve(DETAILS))
      };
      authorizedRolesExtractor = {
        extract: sinon.stub()
      };

      userRequestAuthorizer = proxyquire('../../app/user/user-request-authorizer', {
        './cached-user-resolver': userResolver,
        './authorised-roles-extractor': authorizedRolesExtractor
      });
    });

    it('should reject missing Authorization header AND Authorization cookie', done => {
      request.get.returns(null);
      request.cookies = null;

      userRequestAuthorizer.authorise(request)
        .then(() => done(new Error('Promise should have been rejected')))
        .catch(error => {
          expect(error).to.equal(userRequestAuthorizer.ERROR_TOKEN_MISSING);
          done();
        });
    });

    it('should reject when user cannot be resolved', done => {
      const ERROR = { error: 'oops', status: 401 };
      userResolver.getUserDetails.returns(Promise.reject(ERROR));

      userRequestAuthorizer.authorise(request)
        .then(() => done(new Error('Promise should have been rejected')))
        .catch(error => {
          expect(error).to.equal(ERROR);
          done();
        });
    });

    it('should reject when roles do not match', done => {
      authorizedRolesExtractor.extract.returns(['no-match']);

      userRequestAuthorizer.authorise(request)
        .then(() => done(new Error('Promise should have been rejected')))
        .catch(error => {
          expect(error).to.equal(userRequestAuthorizer.ERROR_UNAUTHORISED_ROLE);
          done();
        });
    });

    it('should NOT reject when no roles extracted', done => {
      authorizedRolesExtractor.extract.returns([]);

      userRequestAuthorizer.authorise(request)
        .then(() => done())
        .catch(error => {
          expect(error).not.to.equal(userRequestAuthorizer.ERROR_UNAUTHORISED_ROLE);
          done();
        });
    });

    it('should fill in user ID placeholder in URL', done => {
      userRequestAuthorizer.authorise(request)
        .then(() => {
          expect(request.url).to.equal('http://caseworkers/1/more/stuff');
          expect(request.originalUrl).to.equal('http://caseworkers/1/more/stuff');
          done();
        })
        .catch(done);
    });

    it('should resolve with user details when all checks OK', done => {
      request.cookies = null;
      authorizedRolesExtractor.extract.returns([ROLE_1]);

      userRequestAuthorizer.authorise(request)
        .then(user => {
          expect(user).to.equal(DETAILS);
          done();
        })
        .catch(() => done(new Error('Promise should have been resolved')));
    });

    it('should NOT reject missing Authorization header when AccessToken cookie present', done => {
      request.get.returns(null);
      authorizedRolesExtractor.extract.returns([]);

      userRequestAuthorizer.authorise(request)
        .then(() => done())
        .catch(error => {
          expect(error).not.to.equal(userRequestAuthorizer.ERROR_TOKEN_MISSING);
          done();
        });
    });

    it('should use the AccessToken cookie when present, to obtain user details', done => {
      request.get.returns(null);

      userRequestAuthorizer.authorise(request)
        .then(() => {
          expect(userResolver.getUserDetails).to.have.been.calledWith(COOKIES[COOKIE_ACCESS_TOKEN]);
          done();
        })
        .catch(() => done(new Error('Promise should have been resolved')));
    });

    it('should use the AccessToken cookie to set the Authorization header, when the header is missing', done => {
      request.get.returns(null);
      request.headers = {'X_CUSTOM_HEADER': X_CUSTOM_HEADER};

      userRequestAuthorizer.authorise(request)
        .then(() => {
          expect(request.headers).not.to.be.undefined;
          expect(request.headers[userReqAuth.AUTHORIZATION]).to.equal('Bearer ' + COOKIES[COOKIE_ACCESS_TOKEN]);
          expect(request.headers['X_CUSTOM_HEADER']).to.equal(X_CUSTOM_HEADER);
          done();
        })
        .catch(() => done(new Error('Promise should have been resolved')));
    });
  });
});
