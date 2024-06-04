const chai = require('chai');
const expect = chai.expect;
const nock = require('nock');

/* The line below turns off ESLints 'no-undef' for the chai 'fail' function */
/*global fail */
describe('Address Lookup', () => {

  let addressLookup;

  before(function(){
    addressLookup = require('../../app/address/address-lookup');
  });

  it('Should expect key and postcode placed holders to be substituted', (done) => {

    let postcode = 'P5TCDE';
    nock('https://api.os.uk')
      .get(/search.*postcode=P5TCDE.*/)
      .reply(200, '{results:[]}');
    addressLookup(postcode).then((body) => {
      expect(body).to.be.equals('{results:[]}');
      done();
    });
  });

    it('Should error when Postcode Service returns non-200 response', (done) => {
      let postcode = 'P5TCDE';
      nock('https://api.os.uk')
        .get(uri => uri.includes('key=AA'))
        .reply(401, 'ErrorBody');

      addressLookup(postcode).then(() => fail('Should reject promise')).catch(
        (error) => {
          try {
            expect(error.error).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
            expect(error.message).to.equal('An error occurred calling the Postcode service.');
            expect(error.status).to.equal(401);
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('Should return the response without modification to the client', (done) => {
      let postcode = 'P5TCDE';
      nock('https://api.os.uk')
        .get(uri => uri.includes('key=AA'))
        .reply(200, 'JSONArray');
      addressLookup(postcode).then(body => expect(body).to.be.equals('JSONArray'));
      done();
    });

  }
);

