const assert = require('assert');
const express = require('express');
const request = require('supertest');
const sinon = require('sinon');
const { STATUS_CODES } = require('http');
const { errorHandler } = require('../app/safe-errors');
const { withFailureDiagnostics, configureFailureTelemetry } = require('../app/failure-diagnostics');

describe('Operational failure telemetry', () => {
  afterEach(() => configureFailureTelemetry(null));

  it('exports exactly one original exception with structured fields and no new public data', () => {
    const events = [];
    configureFailureTelemetry({ trackException: (event) => events.push(event) });
    const original = new Error('PRIVATE original failure');
    const response = withFailureDiagnostics(400, original, () => ({ message: 'Bad Request' }), 'ACTIVITY_VALUE_INVALID');
    assert.deepStrictEqual(response, { message: 'Bad Request' });
    assert.strictEqual(events.length, 1);
    assert.strictEqual(events[0].exception, original);
    assert.deepStrictEqual(events[0].properties, { failureCode: 'ACTIVITY_VALUE_INVALID', httpStatus: '400' });
  });

  it('retains nested cause diagnostics privately without a second exception record', () => {
    const events = [];
    configureFailureTelemetry({ trackException: (event) => events.push(event) });
    const cause = new Error('PRIVATE root cause');
    const original = new Error('PRIVATE wrapper', { cause });
    withFailureDiagnostics(502, original, () => ({ message: 'Bad Gateway' }));
    assert.strictEqual(events.length, 1);
    assert(events[0].properties.causeChain.includes('PRIVATE root cause'));
    assert.strictEqual(events[0].exception, original);
  });

  it('keeps fields isolated across concurrent asynchronous callers', async () => {
    const events = [];
    configureFailureTelemetry({ trackException: (event) => events.push(event) });
    await Promise.all([401, 503].map((status) => withFailureDiagnostics(status, new Error('PRIVATE'),
      async () => new Promise((resolve) => setTimeout(resolve, 1)))));
    assert.deepStrictEqual(events.map((event) => event.properties.httpStatus), ['401', '503']);
    assert.deepStrictEqual(events.map((event) => event.properties.failureCode),
      ['USER_AUTHENTICATION_FAILED', 'APPLICATION_FAILURE']);
  });

  [400, 500].forEach((status) => {
    it(`preserves the actual HTTP ${status} response when the telemetry SDK throws`, async () => {
      let attempts = 0;
      const stderr = sinon.stub(process.stderr, 'write').returns(true);
      configureFailureTelemetry({ trackException() {
        attempts += 1;
        throw new Error('PRIVATE SDK failure');
      } });
      try {
        const app = express();
        app.set('env', 'development');
        app.get('/export-failure', (req, res, next) => {
          const original = new Error('PRIVATE original diagnostic');
          original.status = status;
          next(original);
        });
        app.use(errorHandler);
        const response = await request(app).get('/export-failure');
        const message = STATUS_CODES[status];
        assert.strictEqual(response.status, status);
        assert.deepStrictEqual(response.body, { error: message, status, message });
        assert.strictEqual(attempts, 1);
        assert(!JSON.stringify(response.body).includes('PRIVATE'));
        assert.strictEqual(stderr.args.filter(([text]) => String(text)
          .includes('Operational telemetry export failed')).length, 1);
      } finally {
        stderr.restore();
      }
    });
  });

  it('retains the original diagnostic result even when both export and stderr fail', () => {
    const stderr = sinon.stub(process.stderr, 'write').throws(new Error('stderr unavailable'));
    configureFailureTelemetry({ trackException() { throw new Error('SDK unavailable'); } });
    let originalLogged = 0;
    const original = new Error('PRIVATE original diagnostic');
    try {
      const result = withFailureDiagnostics(400, original, () => {
        originalLogged += 1;
        return { message: 'Bad Request' };
      });
      assert.deepStrictEqual(result, { message: 'Bad Request' });
      assert.strictEqual(originalLogged, 1);
    } finally {
      stderr.restore();
    }
  });
});
