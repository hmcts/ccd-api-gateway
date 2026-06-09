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
    });
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

  it('should reject unsupported content-type on POST', () => {
    const { req, res, next } = mockReqRes('POST', {
      headers: { 'content-type': 'text/plain' },
      body: { foo: 'bar' }
    });
    payloadGuard()(req, res, next);
    expect(res.status.calledWith(415)).to.be.true;
    expect(res.json.calledWithMatch({ error: 'Unsupported Media Type' })).to.be.true;
    expect(next.notCalled).to.be.true;
  });

  it('should reject unsupported content-type on PUT', () => {
    const { req, res, next } = mockReqRes('PUT', {
      headers: { 'content-type': 'text/plain' },
      body: { name: 'name' }
    });
    payloadGuard()(req, res, next);
    expect(res.status.calledWith(415)).to.be.true;
  });


  it('should reject unsupported content-type on PATCH', () => {
    const { req, res, next } = mockReqRes('PATCH', {
      headers: { 'content-type': 'text/plain' },
      body: { age: 'age' }
    });
    payloadGuard()(req, res, next);
    expect(res.status.calledWith(415)).to.be.true;
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

  it('should reject payloads with arrays exceeding maxArrayLength', () => {
    const { req, res, next } = mockReqRes('POST', {
      headers: { 'content-type': 'application/json' },
      body: { items: new Array(10001).fill('x') }
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

  it('should reject payloads containing javascript', () => {
    const { req, res, next } = mockReqRes('POST', {
      headers: { 'content-type': 'application/json' },
      body: { url: 'javascript:alert(1)' }
    });
    payloadGuard()(req, res, next);
    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Payload contains disallowed content' })).to.be.true;
  });

  it('should reject script tags in nested body objects', () => {
    const { req, res, next } = mockReqRes('POST', {
      headers: { 'content-type': 'application/json' },
      body: { a: { b: { c: '<SCRIPT>alert(1)</SCRIPT>' } } }
    });
    payloadGuard()(req, res, next);
    expect(res.status.calledWith(400)).to.be.true;
  });

  it('should call next for non-POST/PUT/PATCH methods', () => {
    const { req, res, next } = mockReqRes('GET', {
      headers: { 'content-type': 'application/json' },
      body: { foo: 'bar' }
    });
    payloadGuard()(req, res, next);
    expect(next.calledOnce).to.be.true;
  });

  it('should call next for application/json with charset', () => {
    const { req, res, next } = mockReqRes('POST', {
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: { foo: 'bar' }
    });
    payloadGuard()(req, res, next);
    expect(next.calledOnce).to.be.true;
  });

  it('should respect custom maxArrayLength option', () => {
    const { req, res, next } = mockReqRes('POST', {
      headers: { 'content-type': 'application/json' },
      body: { items: new Array(5).fill('x') }
    });
    payloadGuard({ maxArrayLength: 3 })(req, res, next);
    expect(res.status.calledWith(413)).to.be.true;
  });

  it('should reject percent-encoded path traversal', () => {
    const { req, res, next } = mockReqRes('POST', {
      url: '/%2e%2e/etc/passwd',
      headers: { 'content-type': 'application/json', host: 'localhost' },
      body: {}
    });
    payloadGuard()(req, res, next);
    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Invalid path' })).to.be.true;
  });

  it('should not reject path traversal when rejectPathTraversal is false', () => {
    const { req, res, next } = mockReqRes('POST', {
      url: '/../etc/passwd',
      headers: { 'content-type': 'application/json', host: 'localhost' },
      body: {}
    });
    payloadGuard({ rejectPathTraversal: false })(req, res, next);
    expect(next.calledOnce).to.be.true;
  });

  it('should not reject script tags when rejectObviousScriptTags is false', () => {
    const { req, res, next } = mockReqRes('POST', {
      headers: { 'content-type': 'application/json' },
      body: { foo: '<script>alert(1)</script>' }
    });
    payloadGuard({ rejectObviousScriptTags: false })(req, res, next);
    expect(next.calledOnce).to.be.true;
  });

  it('should skip content-type check when allowContentTypes is empty', () => {
    const { req, res, next } = mockReqRes('POST', {
      headers: { 'content-type': 'text/xml' },
      body: {}
    });
    payloadGuard({ allowContentTypes: [] })(req, res, next);
    expect(next.calledOnce).to.be.true;
  });

});
