const chai = require('chai');
const expect = chai.expect;
const http = require('http');
const nock = require('nock');
const proxyquire = require('proxyquire');
const request = require('supertest');
const config = require('config');

const IDAM_URL = 'http://test-idam:1234';
const SERVICE_TOKEN = 'endpoint-test-service-token';

const proxyScenarios = [
  {
    name: 'aggregated',
    path: '/aggregated/test-resource',
    downstreamPath: '/aggregated/test-resource'
  },
  {
    name: 'data',
    path: '/data/test-resource',
    downstreamPath: '/test-resource'
  },
  {
    name: 'definition_import',
    path: '/definition_import/test-resource',
    downstreamPath: '/test-resource'
  },
  {
    name: 'documents',
    path: '/documents/test-document',
    downstreamPath: '/documents/test-document'
  },
  {
    name: 'em-anno',
    path: '/em-anno/test-resource',
    downstreamPath: '/api/test-resource'
  },
  {
    name: 'print',
    path: '/print/test-resource',
    downstreamPath: '/test-resource'
  },
  {
    name: 'activity',
    path: '/activity/test-resource',
    downstreamPath: '/test-resource'
  },
  {
    name: 'payments',
    path: '/payments/card-payments/test-payment',
    downstreamPath: '/payments/card-payments/test-payment'
  },
  {
    name: 'pay-bulkscan',
    path: '/pay-bulkscan/cases/test-case',
    downstreamPath: '/pay-bulkscan/cases/test-case'
  },
  {
    name: 'refdata',
    path: '/refdata/test-resource',
    downstreamPath: '/refdata/test-resource'
  }
];

const listen = server => new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});

const close = server => new Promise((resolve, reject) => {
  server.close(error => error ? reject(error) : resolve());
});

describe('Proxy endpoint integration', () => {
  let appServer;
  let appUrl;
  let addressLookupHandler;
  let downstreamServer;
  let downstreamRequests;

  before(async () => {
    downstreamRequests = [];
    downstreamServer = http.createServer((req, res) => {
      downstreamRequests.push({
        headers: req.headers,
        method: req.method,
        url: req.url
      });

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        downstreamPath: req.url,
        proxied: true
      }));
    });
    await listen(downstreamServer);

    const downstreamUrl = `http://127.0.0.1:${downstreamServer.address().port}`;
    const targetOverrides = {
      'proxy.aggregated': downstreamUrl,
      'proxy.case_activity': downstreamUrl,
      'proxy.data': downstreamUrl,
      'proxy.definition_import': downstreamUrl,
      'proxy.document_management': downstreamUrl,
      'proxy.mv_annotations': downstreamUrl,
      'proxy.pay_bulkscan': `${downstreamUrl}/pay-bulkscan`,
      'proxy.payments': `${downstreamUrl}/payments`,
      'proxy.print_service': downstreamUrl,
      'proxy.refdata': `${downstreamUrl}/refdata`
    };
    const endpointConfig = Object.create(config);
    endpointConfig.get = key => targetOverrides[key] || config.get(key);

    const serviceFilter = (req, res, next) => {
      req.headers.ServiceAuthorization = SERVICE_TOKEN;
      next();
    };

    const app = proxyquire('../../app.js', {
      'config': endpointConfig,
      './app/address/address-lookup': postcode => addressLookupHandler(postcode),
      './app/app-insights/app-insights': () => {},
      './app/service/service-filter': serviceFilter
    });

    appServer = http.createServer(app);
    appServer.setMaxListeners(proxyScenarios.length * 2 + 5);
    await listen(appServer);
    appUrl = `http://127.0.0.1:${appServer.address().port}`;
  });

  after(async () => {
    await close(appServer);
    await close(downstreamServer);
  });

  beforeEach(() => {
    addressLookupHandler = () => Promise.reject(new Error('Address lookup response not configured'));
    downstreamRequests.length = 0;
  });

  afterEach(() => {
    if (!nock.isDone()) {
      const pendingMocks = nock.pendingMocks();
      nock.cleanAll();
      chai.assert.fail(`Not all nock interceptors completed: ${pendingMocks.join(', ')}`);
    }
  });

  proxyScenarios.forEach(proxyScenario => {
    it(`should proxy an authenticated request through /${proxyScenario.name}`, async () => {
      const userToken = `Bearer endpoint-test-user-token-${proxyScenario.name}`;
      nockUserDetails(userToken);

      const response = await request(appUrl)
        .get(proxyScenario.path)
        .set('Authorization', userToken)
        .expect(200);

      expect(response.body).to.eql({
        downstreamPath: proxyScenario.downstreamPath,
        proxied: true
      });
      expect(downstreamRequests).to.have.length(1);
      expect(downstreamRequests[0]).to.include({
        method: 'GET',
        url: proxyScenario.downstreamPath
      });
      expect(downstreamRequests[0].headers).to.include({
        authorization: userToken,
        serviceauthorization: SERVICE_TOKEN,
        'user-id': 'endpoint-test-user',
        'user-roles': 'caseworker-test'
      });
    });

    it(`should reject an unauthenticated request to /${proxyScenario.name}`, async () => {
      const response = await request(appUrl)
        .get(proxyScenario.path)
        .expect(401);

      expect(response.body).to.include({
        error: 'Bearer token missing',
        status: 401,
        message: 'You are not authorized to access this resource'
      });
      expect(downstreamRequests).to.be.empty;
    });
  });

  it('should return an address lookup response through /addresses', async () => {
    const userToken = 'Bearer endpoint-test-user-token-addresses-success';
    const addresses = [{
      AddressLine1: '1 Test Street',
      PostTown: 'London',
      Postcode: 'SW1A 1AA'
    }];
    nockUserDetails(userToken);
    addressLookupHandler = postcode => {
      expect(postcode).to.equal('SW1A1AA');
      return Promise.resolve(addresses);
    };

    const response = await request(appUrl)
      .get('/addresses')
      .query({ postcode: 'SW1A1AA' })
      .set('Authorization', userToken)
      .expect(200);

    expect(response.body).to.eql(addresses);
    expect(downstreamRequests).to.be.empty;
  });

  it('should return a downstream failure through /addresses', async () => {
    const userToken = 'Bearer endpoint-test-user-token-addresses-failure';
    nockUserDetails(userToken);
    addressLookupHandler = () => Promise.reject({
      error: 'Address lookup failed',
      status: 502,
      message: 'The address service is unavailable'
    });

    const response = await request(appUrl)
      .get('/addresses')
      .query({ postcode: 'SW1A1AA' })
      .set('Authorization', userToken)
      .expect(502);

    expect(response.body).to.include({
      error: 'Address lookup failed',
      status: 502,
      message: 'The address service is unavailable'
    });
    expect(downstreamRequests).to.be.empty;
  });
});

const nockUserDetails = userToken => {
  nock(IDAM_URL, {
    reqheaders: {
      Authorization: userToken
    }
  })
    .get('/o/userinfo')
    .reply(200, {
      roles: ['caseworker-test'],
      uid: 'endpoint-test-user'
    });
};
