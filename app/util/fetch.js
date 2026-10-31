let _fetch = require('node-fetch').default;

const readDiagnostic = (response) => new Promise((resolve) => {
  const stream = response.body;
  if (!stream) {
    resolve({ body: '' });
    return;
  }
  const chunks = [];
  let length = 0;
  const finish = (cause) => {
    clearTimeout(timer);
    stream.removeListener('data', onData);
    stream.removeListener('end', onEnd);
    stream.removeListener('error', onError);
    stream.removeListener('close', onClose);
    stream.destroy();
    resolve({ body: Buffer.concat(chunks, length).toString('utf8'), cause });
  };
  const onData = (chunk) => {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    const retained = buffer.subarray(0, 4096 - length);
    chunks.push(retained);
    length += retained.length;
    if (length === 4096) {
      finish();
    }
  };
  const onEnd = () => finish();
  const onError = (error) => finish(error);
  const onClose = () => finish(new Error('Upstream error body closed before completion'));
  const timer = setTimeout(() => finish(new Error('Upstream error body read timed out')), 5000);
  stream.on('data', onData);
  stream.once('end', onEnd);
  stream.once('error', onError);
  stream.once('close', onClose);
});

const fetch = (...args) => {
  return _fetch(...args)
    .then(res => {

      if (res.status >= 200 && res.status < 300) {
          return res;
      }

      // A Response has no useful stack; preserve bounded upstream diagnostics privately.
      return readDiagnostic(res).then(({ body, cause }) => {
        const error = new Error(`Upstream HTTP ${res.status} ${res.statusText}: ${body}`);
        error.status = res.status;
        if (cause) {
          error.cause = cause;
        }
        throw error;
      });
    });
};

module.exports = fetch;
