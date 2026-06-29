const chai = require('chai');
const expect = chai.expect;
const nock = require('nock');
const proxyquire = require('proxyquire');

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

    it('Should configure HTTPS proxy agent when proxy detection is enabled', (done) => {
      const existingProxy = process.env.https_proxy;
      process.env.https_proxy = 'http://proxy.example:8080';
      let capturedConfig;
      const restoreProxy = () => {
        if (existingProxy === undefined) {
          delete process.env.https_proxy;
        } else {
          process.env.https_proxy = existingProxy;
        }
      };

      function HttpsProxyAgent(proxyUrl) {
        this.proxyUrl = proxyUrl;
      }

      const proxiedAddressLookup = proxyquire('../../app/address/address-lookup', {
        config: {
          address_lookup: {
            detect_proxy: true,
            url: 'https://api.os.uk/search?key=${key}&postcode=${postcode}'
          },
          get: () => 'AA'
        },
        'node-fetch': (url, httpConfig) => {
          expect(url).to.contain('P5TCDE');
          capturedConfig = httpConfig;
          return Promise.resolve({
            status: 200,
            text: () => Promise.resolve('JSONArray')
          });
        },
        'https-proxy-agent': { HttpsProxyAgent }
      });

      proxiedAddressLookup('P5TCDE').then((body) => {
        try {
          expect(body).to.equal('JSONArray');
          expect(capturedConfig.agent).to.be.instanceOf(HttpsProxyAgent);
          expect(capturedConfig.agent.proxyUrl).to.equal('http://proxy.example:8080');
          restoreProxy();
          done();
        } catch (e) {
          restoreProxy();
          done(e);
        }
      }).catch((e) => {
        restoreProxy();
        done(e);
      });
    });

  }
);
