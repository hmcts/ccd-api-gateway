let telemetryClient;

const failureCode = (error, status) => {
  if (error && (['FetchError', 'UpstreamResponseError'].includes(error.name) || error.cause)) {
    return 'DEPENDENCY_REQUEST_FAILED';
  }
  if (status === 401) {
    return 'USER_AUTHENTICATION_FAILED';
  }
  if (status === 403) {
    return 'AUTHORISATION_DENIED';
  }
  return error && error.type === 'entity.parse.failed' ? 'REQUEST_BODY_INVALID' : 'APPLICATION_FAILURE';
};

// The current SDK correlates Winston 2 logs but does not automatically export their records.
const configureFailureTelemetry = (client) => { telemetryClient = client; };

const withFailureDiagnostics = (status, error, callback, businessCode) => {
  const fields = {
    failureCode: businessCode || failureCode(error, status), httpStatus: String(status)
  };
  const result = callback(fields);
  if (telemetryClient) {
    try {
      const original = error instanceof Error
        ? error : new Error(error && error.message ? error.message : 'Request failed');
      const properties = { ...fields };
      const causes = [];
      const seen = new Set([original]);
      let cause = original.cause;
      while (cause && !seen.has(cause) && causes.length < 16) {
        seen.add(cause);
        causes.push(cause.stack || String(cause));
        cause = cause.cause;
      }
      if (causes.length) {
        properties.causeChain = causes.join('\nCaused by: ');
      }
      telemetryClient.trackException({
        exception: original, properties, severity: status >= 500 ? 3 : 2
      });
    } catch (exportError) { // eslint-disable-line no-unused-vars
      // Bypass console/SDK hooks so reporting a failure cannot call the failed exporter again.
      try {
        process.stderr.write('Operational telemetry export failed; original diagnostic retained in server logs.\n');
      } catch (stderrError) { // eslint-disable-line no-unused-vars
        // An unavailable telemetry or stderr sink must not replace the controlled HTTP response.
      }
    }
  }
  return result;
};

module.exports = { withFailureDiagnostics, configureFailureTelemetry };
