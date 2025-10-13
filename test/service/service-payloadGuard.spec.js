const proxyquire = require('proxyquire');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');

// Use CommonJS import for the ES module
describe('service-payloadGuard middleware', () => {
  let payloadGuard, LoggerStub, loggerStub;

  beforeEach(() => {
    loggerStub = { warn: sinon.spy(), info: sinon.spy() };
    LoggerStub = { getLogger: sinon.stub().returns(loggerStub) };
    payloadGuard = proxyquire('../../app/service/service-payloadGuard', {
      '@hmcts/nodejs-logging': { Logger: LoggerStub }
    }).default;
  });

  function mockReqRes(method, opts = {}) {
    const req = {
      method,
      headers: opts.headers || {},
      url: opts.url || '/test',
      body: opts.body
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis()
    };
    const next = sinon.spy();
    return { req, res, next };
  }

  it('should call next for allowed content-type', () => {
    const { req, res, next } = mockReqRes('POST', {
      headers: { 'content-type': 'application/json' },
      body: { foo: 'bar' }
    });
    payloadGuard()(req, res, next);
    expect(next.calledOnce).to.be.true;
  });

  it('should reject unsupported content-type', () => {
    const { req, res, next } = mockReqRes('POST', {
      headers: { 'content-type': 'text/plain' },
      body: { foo: 'bar' }
    });
    payloadGuard()(req, res, next);
    expect(res.status.calledWith(415)).to.be.true;
    expect(res.json.calledWithMatch({ error: 'Unsupported Media Type' })).to.be.true;
    expect(next.notCalled).to.be.true;
  });

  it('should reject path traversal attempts', () => {
    const { req, res, next } = mockReqRes('POST', {
      url: '/../etc/passwd',
      headers: { 'content-type': 'application/json', host: 'localhost' },
      body: { foo: 'bar' }
    });
    payloadGuard()(req, res, next);
    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Invalid path' })).to.be.true;
    expect(next.notCalled).to.be.true;
  });

  it('should reject payloads that are too large or deeply nested', () => {
    // Create a deeply nested object
    let obj = {};
    let cur = obj;
    for (let i = 0; i < 50; i++) {
      cur.nest = {};
      cur = cur.nest;
    }
    const { req, res, next } = mockReqRes('POST', {
      headers: { 'content-type': 'application/json' },
      body: obj
    });
    payloadGuard()(req, res, next);
    expect(res.status.calledWith(413)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Payload too large or too deeply nested' })).to.be.true;
    expect(next.notCalled).to.be.true;
  });

  it('should reject payloads containing <script> tags', () => {
    const { req, res, next } = mockReqRes('POST', {
      headers: { 'content-type': 'application/json' },
      body: { foo: '<script>alert(1)</script>' }
    });
    payloadGuard()(req, res, next);
    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Payload contains disallowed content' })).to.be.true;
    expect(next.notCalled).to.be.true;
  });

  it('should call next for non-POST/PUT/PATCH methods', () => {
    const { req, res, next } = mockReqRes('GET', {
      headers: { 'content-type': 'application/json' },
      body: { foo: 'bar' }
    });
    payloadGuard()(req, res, next);
    expect(next.calledOnce).to.be.true;
  });
});
