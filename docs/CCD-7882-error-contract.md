# CCD-7882 error contract

Related requirements: CCD-7108 and CME-984.

Prevent public errors from revealing exception classes, stack traces, internal URLs, file paths
or software details. Preserve response schemas, HTTP status mappings, approved business messages
and public `message` fields where present, while retaining useful private diagnostics.

## Responses

- Route authentication, service/proxy and unhandled application failures through controlled error
  responses.
- Return `{ "error": ..., "status": ..., "message": ... }` with HTTP reason text instead of
  exception stacks, internal URLs or dependency details. The body status matches the HTTP response.
- Map recognised network failures to 502 and other fetch failures to 500. Other valid 4xx/5xx
  statuses pass through the final error middleware. Add no public error-code field.

## Diagnostics

Log original causes once at WARN for 4xx or ERROR for 5xx, with private `failureCode` and
`httpStatus` dimensions. Export one explicit SDK exception because the Winston integration does not
export ordinary logger records. Correlation context and nested causes are retained; SDK export
failures cannot replace the HTTP response.

## Verification

Focused HTTP, proxy/authentication and telemetry tests cover public schemas, sanitisation and
single-event logging. DEBUG/INFO/WARN/ERROR thresholds pass. Docker verifies correlated failure
export: ordinary logs remain in server output rather than Insights.

## Support

In Application Insights, filter private `failureCode` and `httpStatus` dimensions, then use
`operation_Id` to find related requests and dependencies. Inspect exception details in restricted
telemetry or server logs; public error messages are sanitised. Failure diagnosis should work at
normal production logging levels without enabling DEBUG.

Ordinary Winston logs, including DEBUG, remain in server output; the explicit SDK path exports
structured failure telemetry to Insights.

## Deployment checks

- Verify effective error/logging settings and sanitised responses in each environment.
- Confirm diagnostic logs and Application Insights are restricted to authorised personnel, with
  suitable sampling and retention.
- Verify failure codes and correlation IDs are searchable at normal production logging levels;
  run deployed consumer/Pact checks.
