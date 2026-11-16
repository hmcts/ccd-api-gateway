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

Internal category codes and structured `failureCode` values stay in diagnostics, not public
error bodies.

Log original causes once at WARN for 4xx or ERROR for 5xx, with private `failureCode` and
`httpStatus` dimensions. Export one explicit SDK exception because the Winston integration does not
export ordinary logger records. Correlation context and nested causes are retained; SDK export
failures cannot replace the HTTP response.

## Verification

Focused HTTP, proxy/authentication and telemetry tests cover public schemas, sanitisation and
single-event logging. DEBUG/INFO/WARN/ERROR thresholds pass. Docker verifies correlated failure
export: ordinary logs remain in server output rather than Insights.

## Support

1. Record the service/environment, UTC failure time, HTTP status and any existing request/trace ID.
   No new correlation field is added to public responses; do not collect credentials or tokens.
2. Open **Application Insights → Logs** for the affected environment/resource. Leave the filters
   empty to discover codes, or set both strings to narrow the search.

```kusto
let wantedCode = "";   // e.g. "DEPENDENCY_REQUEST_FAILED"
let wantedStatus = ""; // e.g. "502"
union exceptions, traces
| where timestamp > ago(24h)
| extend failureCode = tostring(customDimensions["failureCode"]),
         httpStatus = tostring(customDimensions["httpStatus"])
| where isnotempty(failureCode)
| where isempty(wantedCode) or failureCode == wantedCode
| where isempty(wantedStatus) or httpStatus == wantedStatus
| project timestamp, cloud_RoleName, failureCode, httpStatus, operation_Id,
          diagnostic = coalesce(outerMessage, message)
| order by timestamp desc
```

These private dimensions appear on instrumented failure events, not every log or public response.
Search both tables: a failure log without an exception can be recorded as a trace. Use normal
WARN/ERROR diagnostics first; DEBUG is not required to search these fields.

3. Copy a non-empty `operation_Id` from a matching event to find related telemetry and exception
   details. Adjust the time window and include related resources if stored separately.

```kusto
union requests, dependencies, exceptions, traces
| where timestamp > ago(24h)
| where operation_Id == "PASTE_OPERATION_ID"
| order by timestamp asc
```

`operation_Id` is the standard Insights correlation column, not a new public error code. Related
records must be instrumented, collected and retained; sampling can leave an incomplete transaction.
If nothing matches, clear filters and check resource/time selection, collection and restricted
server logs rather than assuming no failure occurred.

These queries use Application Insights resource table names. Workspace queries use
`AppExceptions`/`AppTraces`/`AppRequests`/`AppDependencies`, with `TimeGenerated`, `Properties`,
`OperationId` and `AppRoleName` instead of `timestamp`, `customDimensions`, `operation_Id` and
`cloud_RoleName`. Message columns also differ; see the
[Microsoft telemetry schema](https://learn.microsoft.com/en-us/azure/azure-monitor/app/data-model-complete).

Local Docker checks received explicit SDK failure exports with these dimensions and matching
request operation IDs at INFO. The tested Winston integration did not export ordinary log records,
including DEBUG; use restricted server logs for those. Do not assume stdout is collected in Insights.

**Verification limit:** these KQL examples were checked against documented schema and local
telemetry field names, but have not been executed against Azure and remain unverified. Production
collection, dependency joins, resource scope, access controls, sampling and retention need checks
in the target environment. Diagnostic details are for authorised support personnel only.

## Deployment checks

- Verify effective error/logging settings and sanitised responses in each environment.
- Confirm diagnostic logs and Application Insights are restricted to authorised personnel, with
  suitable sampling and retention.
- Verify failure codes and correlation IDs are searchable at normal production logging levels;
  run deployed consumer/Pact checks.
