const assert = require('assert');
const proxyquire = require('proxyquire');
const express = require('express');
const request = require('supertest');
const { safeError, errorHandler } = require('../app/safe-errors');

describe('CCD-7882 controlled errors', () => {
  [400, 401, 403, 404, 409, 422, 500, 502, 504].forEach((status) => {
    it(`redacts diagnostics while preserving status ${status}`, async () => {
      const app = express();
      app.set('env', 'development');
      app.get('/private-path', (req, res, next) => {
        const err = new Error('SECRET jdbc://internal-host SQL exception');
        err.status = status;
        err.error = 'SECRET upstream body';
        next(err);
      });
      app.use(errorHandler);
      const response = await request(app).get('/private-path?trace=true');
      assert.strictEqual(response.status, status);
      assert.deepStrictEqual(response.body, safeError(status));
      assert(!JSON.stringify(response.body).includes('SECRET'));
      assert(!JSON.stringify(response.body).includes('private-path'));
    });
  });

  it('uses 500 for untrusted or absent status values', () => {
    [undefined, null, 'SECRET', 200, 999, 500.5].forEach((status) => {
      assert.strictEqual(safeError(status).status, 500);
    });
  });

  it('delegates an already committed response without rewriting it', () => {
    const original = new Error('SECRET');
    let delegated;
    errorHandler(original, {}, { headersSent: true }, (err) => { delegated = err; });
    assert.strictEqual(delegated, original);
  });
  it('redacts malformed JSON parser details and preserves 400', async () => {
    const app = express();
    app.use(express.json());
    app.post('/', (req, res) => res.sendStatus(204));
    app.use(errorHandler);
    const response = await request(app).post('/').set('Content-Type', 'application/json')
      .send('{"SECRET":');
    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.body.code, 'INVALID_REQUEST');
    assert(!JSON.stringify(response.body).includes('SECRET'));
  });

});

describe('CCD-7882 support diagnostics without DEBUG', () => {
  it('logs the original stack while returning a generic response', () => {
    const events = [];
    const logger = { error: (message, metadata) => events.push({ message, metadata }) };
    const handler = proxyquire('../app/safe-errors', {
      '@hmcts/nodejs-logging': { Logger: { getLogger: () => logger } },
      debug: () => () => {}
    }).errorHandler;
    const original = new Error('PRIVATE original failure');
    let body;
    const response = {
      status: () => response,
      json: (value) => { body = value; }
    };
    handler(original, {}, response, () => {});
    assert.strictEqual(events.length, 1);
    assert.strictEqual(events[0].metadata.error, original.stack);
    assert.deepStrictEqual(body, safeError(500));
    assert(!JSON.stringify(body).includes('PRIVATE'));
  });
});

describe('CCD-7882 direct proxy diagnostics', () => {
  it('retains the original proxy failure without exposing it in the response', () => {
    const events = [];
    const logger = { error: (message, metadata) => events.push({ message, metadata }) };
    const mapFetchErrors = proxyquire('../app/user/auth-checker-user-only-filter', {
      '@hmcts/nodejs-logging': { Logger: { getLogger: () => logger } },
      debug: () => () => {}
    }).mapFetchErrors;
    const original = new Error('ECONNREFUSED PRIVATE upstream');
    let body;
    let status;
    mapFetchErrors(original, {
      status: (value) => { status = value; },
      json: (value) => { body = value; }
    });
    assert.strictEqual(events.length, 1);
    assert.strictEqual(events[0].metadata.error, original.stack);
    assert.strictEqual(status, 502);
    assert.deepStrictEqual(body, safeError(502));
  });
});


describe('CCD-7882 single authentication diagnostic', () => {
  [false, true].forEach((upstreamFailure) => {
    it(`logs an authentication failure once, upstream=${upstreamFailure}`, async () => {
      const events = [];
      const logger = {
        error: (message, metadata) => events.push({ level: 'error', metadata }),
        warn: (message, metadata) => events.push({ level: 'warn', metadata })
      };
      const original = new Error(upstreamFailure ? 'ECONNREFUSED PRIVATE upstream' : 'PRIVATE authentication');
      original.name = upstreamFailure ? 'FetchError' : 'Error';
      original.status = 401;
      const handler = proxyquire('../app/safe-errors', {
        '@hmcts/nodejs-logging': { Logger: { getLogger: () => logger } }
      }).errorHandler;
      const imported = proxyquire('../app/user/auth-checker-user-only-filter', {
        './user-request-authorizer': { authorise: () => Promise.reject(original), '@noCallThru': true },
        '@hmcts/nodejs-logging': { Logger: { getLogger: () => logger } }
      });
      const filter = imported.authCheckerUserOnlyFilter || imported;
      let body;
      const response = {
        status: () => response,
        json: (value) => { body = value; }
      };
      await new Promise((resolve) => {
        filter({ headers: {} }, response, (failure) => {
          handler(failure, {}, response, () => {});
          resolve();
        });
      });
      assert.strictEqual(events.length, 1);
      assert.strictEqual(events[0].level, upstreamFailure ? 'error' : 'warn');
      assert.strictEqual(events[0].metadata.error, original.stack);
      assert.deepStrictEqual(body, safeError(upstreamFailure ? 502 : 401));
      assert(!JSON.stringify(body).includes('PRIVATE'));
    });
  });
});

describe('CCD-7882 nested diagnostics', () => {
  const { diagnosticError } = require('../app/safe-errors');
  it('retains a nested cause and terminates a cyclic chain', () => {
    const root = new Error('PRIVATE_ROOT_CAUSE');
    const outer = new Error('PRIVATE_WRAPPER', { cause: root });
    assert(diagnosticError(outer).includes('PRIVATE_ROOT_CAUSE'));
    root.cause = outer;
    assert(diagnosticError(outer).includes('cyclic'));
    assert(!JSON.stringify(safeError(500, outer)).includes('PRIVATE'));
  });
});

describe('CCD-7882 upstream HTTP diagnostics', () => {
  it('retains the upstream status and body in a private Error', async () => {
    const fetch = proxyquire('../app/util/fetch', {
      'node-fetch': () => Promise.resolve(new (require('node-fetch').Response)(require('stream').Readable.from(['PRIVATE_UPSTREAM_DIAGNOSTIC']), {
        status: 500,
        statusText: 'Internal Server Error'
      }))
    });
    await assert.rejects(fetch('http://synthetic.invalid'), (error) => (
      error.status === 500 && error.message.includes('PRIVATE_UPSTREAM_DIAGNOSTIC')
    ));
  });

  const withStream = (stream) => proxyquire('../app/util/fetch', {
    'node-fetch': () => Promise.resolve(new (require('node-fetch').Response)(stream, { status: 401 }))
  });

  it('stops after 4096 bytes even when the upstream body stays open', async () => {
    const stream = new (require('stream').PassThrough)();
    const pending = withStream(stream)('http://synthetic.invalid');
    stream.write(Buffer.alloc(8192, 'x'));
    await assert.rejects(pending, (error) => (
      error.status === 401 && error.message.split(': ')[1].length === 4096
    ));
    assert(stream.destroyed);
  });

  it('preserves HTTP status and the cause when reading fails', async () => {
    const stream = new (require('stream').PassThrough)();
    const pending = withStream(stream)('http://synthetic.invalid');
    await Promise.resolve();
    const cause = new Error('interrupted');
    stream.destroy(cause);
    await assert.rejects(pending, (error) => error.status === 401 && error.cause === cause);
  });

  it('closes stalled error bodies after five seconds and preserves status', async () => {
    const clock = require('sinon').useFakeTimers();
    const stream = new (require('stream').PassThrough)();
    try {
      const pending = withStream(stream)('http://synthetic.invalid');
      await Promise.resolve();
      clock.tick(5000);
      await assert.rejects(pending, (error) => (
        error.status === 401 && error.cause.message.includes('timed out')
      ));
      assert(stream.destroyed);
    } finally {
      clock.restore();
    }
  });
});
