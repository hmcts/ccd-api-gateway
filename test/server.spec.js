const chai = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noPreserveCache();

const expect = chai.expect;

function loadServer(environment) {
  const httpServer = {};
  const httpsServer = {};
  const httpCreateServer = sinon.stub().returns(httpServer);
  const httpsCreateServer = sinon.stub().returns(httpsServer);
  const readFileSync = sinon.stub().returns(Buffer.from('local-test-file'));
  const originalEnvironment = {
    ENV: process.env.ENV,
    HTTPS_CERT_PATH: process.env.HTTPS_CERT_PATH,
    HTTPS_KEY_PATH: process.env.HTTPS_KEY_PATH
  };

  Object.assign(process.env, environment);
  try {
    const serverModule = proxyquire('../server', {
      http: { createServer: httpCreateServer },
      https: { createServer: httpsCreateServer },
      fs: { readFileSync }
    });
    return { serverModule, httpCreateServer, httpsCreateServer, readFileSync };
  } finally {
    for (const [name, value] of Object.entries(originalEnvironment)) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  }
}

describe('server protocol selection', () => {
  it('uses HTTP for local development without certificate paths', () => {
    const result = loadServer({ ENV: 'localdev', HTTPS_CERT_PATH: '', HTTPS_KEY_PATH: '' });

    expect(result.httpCreateServer.calledOnce).to.equal(true);
    expect(result.httpsCreateServer.notCalled).to.equal(true);
  });

  it('uses HTTPS when both certificate paths are supplied', () => {
    const result = loadServer({
      ENV: 'localdev',
      HTTPS_CERT_PATH: '/tmp/local.crt',
      HTTPS_KEY_PATH: '/tmp/local.key'
    });

    expect(result.httpsCreateServer.calledOnce).to.equal(true);
    expect(result.readFileSync.calledWith('/tmp/local.crt')).to.equal(true);
    expect(result.readFileSync.calledWith('/tmp/local.key')).to.equal(true);
  });

  it('rejects only one HTTPS path', () => {
    expect(() => loadServer({ ENV: 'localdev', HTTPS_CERT_PATH: '/tmp/local.crt', HTTPS_KEY_PATH: '' }))
      .to.throw('HTTPS_CERT_PATH and HTTPS_KEY_PATH must both be set');
  });

  it('uses HTTP outside local development', () => {
    const result = loadServer({ ENV: 'test', HTTPS_CERT_PATH: '/tmp/local.crt', HTTPS_KEY_PATH: '/tmp/local.key' });

    expect(result.httpCreateServer.calledOnce).to.equal(true);
    expect(result.httpsCreateServer.notCalled).to.equal(true);
  });
});
