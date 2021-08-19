const chai = require('chai');
const sanitize = require('../../app/util/sanitize');
const expect = chai.expect;


describe('validate access control request headers regex', () => {
  it('should return true for valid input', () => {
    let requestHeader = 'accept';
    let response = sanitize.validateAccessControlRequestHeaders(requestHeader);

    expect(response).to.be.true;
  });

  it('should return true for valid input list', () => {
    let requestHeader = 'Accept, Authorization, Content-Type';
    let response = sanitize.validateAccessControlRequestHeaders(requestHeader);

    expect(response).to.be.true;
  });

  it('should return false for valid input', () => {
    let requestHeader = '@ccept';
    let response = sanitize.validateAccessControlRequestHeaders(requestHeader);

    expect(response).to.be.false;
  });
});

describe('validate origin regex', () => {
  it('should return true for valid input', () => {
    let origin = 'http://localhost:3451';
    let response = sanitize.validateOrigin(origin);

    expect(response).to.be.true;
  });

  it('should return true for valid input list', () => {
    let origin = 'http://localhost:3451, *';
    let response = sanitize.validateOrigin(origin);

    expect(response).to.be.true;
  });

  it('should return false for valid input', () => {
    let origin = 'http://something?questionable';
    let response = sanitize.validateOrigin(origin);

    expect(response).to.be.false;
  });
});

