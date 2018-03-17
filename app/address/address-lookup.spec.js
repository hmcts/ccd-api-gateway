const chai = require('chai');
const expect = chai.expect;
const mockery = require('mockery');
const nock = require('nock');
const sinon = require('sinon');

describe('Address Lookup', () => {

  let addressLookup, extractAddressStub;

  before(function(){
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });

    extractAddressStub = sinon.stub();
    mockery.registerMock('./extract-address', extractAddressStub);
    addressLookup = require('./address-lookup');

  });

    it('Should return promise containing addresses extracted from Postcode Service response sorted by field AddressLine1', (done) => {

      let postcode = 'P5TCDE';

      let postcodeServiceResponseAddress1 = {address:'Address1'};
      let postcodeServiceResponseAddress2 = {address:'Address2'};
      let postcodeServiceResponseAddress3 = {address:'Address3'};
      let postcodeServiceResponse = [postcodeServiceResponseAddress1, postcodeServiceResponseAddress2, postcodeServiceResponseAddress3];
      nock('https://postcodeinfo.service.justice.gov.uk')
        .get('/addresses?postcode=' + postcode)
        .reply(200, postcodeServiceResponse);

      let extractedAddress1 = {AddressLine1: '123 Something street'};
      let extractedAddress2 = {AddressLine1: '1 Something street'};
      let extractedAddress3 = {AddressLine1: '12 Something street'};

      extractAddressStub.withArgs(postcodeServiceResponseAddress1).returns(extractedAddress1);
      extractAddressStub.withArgs(postcodeServiceResponseAddress2).returns(extractedAddress2);
      extractAddressStub.withArgs(postcodeServiceResponseAddress3).returns(extractedAddress3);

      addressLookup(postcode).then((addresses) => {
        try {
          expect(addresses.length).to.equal(3);
          expect(addresses[0]).to.equal(extractedAddress2);
          expect(addresses[1]).to.equal(extractedAddress3);
          expect(addresses[2]).to.equal(extractedAddress1);
          done();
        }
        catch (e) {
          done(e);
        }
      });
   });

  it('Should return promise containing addresses extracted from Postcode Service response, unsorted if field AddressLine1 is not defined', (done) => {

    var postcode = 'P5TCDE';

    let postcodeServiceResponseAddress1 = {address:'Address1'};
    let postcodeServiceResponseAddress2 = {address:'Address2'};
    let postcodeServiceResponseAddress3 = {address:'Address3'};
    let postcodeServiceResponse = [postcodeServiceResponseAddress1, postcodeServiceResponseAddress2, postcodeServiceResponseAddress3];

    nock('https://postcodeinfo.service.justice.gov.uk')
      .get('/addresses?postcode=' + postcode)
      .reply(200, postcodeServiceResponse);

    let extractedAddress1 = {address:'ExtractedAddress1'};
    let extractedAddress2 = {address:'ExtractedAddress2'};
    let extractedAddress3 = {address:'ExtractedAddress3'};

    extractAddressStub.withArgs(postcodeServiceResponseAddress1).returns(extractedAddress1);
    extractAddressStub.withArgs(postcodeServiceResponseAddress2).returns(extractedAddress2);
    extractAddressStub.withArgs(postcodeServiceResponseAddress3).returns(extractedAddress3);

    addressLookup(postcode).then((addresses) => {
      try {
        expect(addresses.length).to.equal(3);
        expect(addresses[0]).to.equal(extractedAddress1);
        expect(addresses[1]).to.equal(extractedAddress2);
        expect(addresses[2]).to.equal(extractedAddress3);
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });


  it('Should error when Postcode Service returns non-200 response', (done) => {

      let postcode = 'P5TCDE';
      nock('https://postcodeinfo.service.justice.gov.uk')
        .get('/addresses?postcode=' + postcode)
        .reply(500, 'ErrorBody');

      addressLookup(postcode).then(() => fail("Should reject promise")).catch(
        (error) => {
            try {
              expect(error.error).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
              expect(error.message).to.equal('An error occurred calling the Postcode service.');
              expect(error.status).to.equal(500);
              done();
            }
          catch (e) {
              done(e);
          }
        });
    });

    it('Should error when Postcode Service returns an unparsable 200 response', (done) => {

      let postcode = 'P5TCDE';
      nock('https://postcodeinfo.service.justice.gov.uk')
        .get('/addresses?postcode=' + postcode)
        .reply(200, 'NotJSONArray');

      addressLookup(postcode).then(() => fail("Should reject promise")).catch(
        (error) => {
          try {
            expect(error.error).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
            expect(error.message).to.equal('An error occurred calling the Postcode service.');
            expect(error.status).to.equal(500);
            done();
          }
          catch (e) {
            done(e)
          }
      });
    });
});
