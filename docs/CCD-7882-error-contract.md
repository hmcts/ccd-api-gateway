# CCD-7882: controlled error responses

## MSAL advisory assessment — 29 October 2026

CVE-2026-109461 affects the MSAL authorization-code flow. The current dependency chain is
Application Insights 3.17.0 → Azure Identity 4.14.0 → MSAL Node 6.0.1. Azure Identity declares
MSAL `^6.0.0`; forcing patched MSAL 7.1.0 is outside that range and was removed.
Microsoft's Azure Identity changelog places MSAL `^7.1.0` in unreleased 4.15.0-beta.2.
The gateway exchanges OAuth codes with node-fetch; its telemetry setup uses an instrumentation
key and does not configure MSAL authorization-code or interactive-browser credentials.
This source assessment supports review of the existing advisory-specific audit exception;
it does not remove the vulnerable package or establish deployed applicability. The existing
exception remains unchanged. Adopt a stable upstream release with patched MSAL when available.
Sources: [MSAL advisory](https://github.com/AzureAD/microsoft-authentication-library-for-js/security/advisories/GHSA-xcx6-jx8p-x3h5),
[Azure Identity changelog](https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/identity/identity/CHANGELOG.md).

## Current support logging policy

Public error responses remain generic. Detailed request failures, including exception causes
and stack traces, are retained at normal WARN/ERROR levels in server logs; DEBUG is optional
additional troubleshooting. Dependency and health diagnostics retain their originating severity
and respect the source logger threshold. Support must not need to enable DEBUG and reproduce
an incident to obtain its original failure details.

Branch `CCD-7882_Verbose_Error_Messages` was created from local `master` on 20 October 2026.

The final middleware always returns a generic status/error/message/code body, including in development. Fetch/S2S diagnostic text is removed from public errors; original fetch details are retained in server logs at WARN/ERROR levels. Proxy fetch failures use the same safe body. The existing direct-fetch fallback had HTTP 500 with body status 504; the body now correctly reports 500.

Error categories: INVALID_REQUEST (400/422), AUTHENTICATION_REQUIRED (401), ACCESS_DENIED (403), RESOURCE_NOT_FOUND (404), METHOD_NOT_ALLOWED (405), REQUEST_TOO_LARGE (413), UNSUPPORTED_MEDIA_TYPE (415), TOO_MANY_REQUESTS (429), INTERNAL_ERROR (5xx), otherwise REQUEST_FAILED. Codes describe categories, not individual incidents. Boot fallback and empty security responses do not promise a category code.

## Remediation requirement

The supplied finding concerns unauthenticated disclosure of implementation details through HTTP
error responses. It requires generic public responses and detailed server diagnostics accessible
only to administrators. An event reference is optional. The support logging policy above retains
those diagnostics without requiring DEBUG or incident reproduction.

## Local verification

51 focused Mocha tests passed; changed-file ESLint and diff checks passed. Coverage includes
public middleware in development, malformed JSON, fetch/S2S failures, committed responses,
application proxy wiring, nested/cyclic causes and single authentication diagnostics. Error-body
reads stop at 4,096 bytes or five seconds, close the stream and preserve the upstream HTTP status
if reading fails. These tests use stubbed dependencies and do not validate real IDAM/S2S credentials.
The full suite could not start because the local S2S secret was missing.

## Deployment handoff

Verify production images, ingress/upstream error pages, deployed BEFTA/ITHC, real dependency
failures, administrator-only log access, retention and Application Insights collection before
release. Local tests do not establish these controls. Internal diagnostics may contain sensitive
information. Preserve useful validation responses and existing protocol behaviour.

## Paired application-container verification — 22 October 2026

The bounded diagnostic formatter retains nested Error.cause chains and terminates cycles. Rejected upstream HTTP responses now become private Errors with status and bounded body diagnostics, rather than logging [object Response]. Public statuses and generic bodies remain unchanged. At that verification point, 48 focused tests passed and changed-file ESLint passed.

Both INFO (DEBUG off) and DEBUG runs passed all six checks: anonymous JSON/HTML,
invalid user bearer or invalid service credentials as appropriate, authenticated dependency failure,
health-detail redaction and retained original server diagnostics. This is 12 checks for this service.
Different services retain their existing HTTP status and validation contracts; diagnostic redaction
is consistent. Support logging is the policy; authentication logging is one covered failure category.
Neither requires enabling DEBUG to retain original failures.

The shared local driver is review-reports/CCD-7882/verify_docker.py in the parent workspace.
Run from the workspace root with --repo ccd-api-gateway (both modes are the default).
Fresh Java bootJars or the current Node application source/dependencies were used, with synthetic
OIDC/S2S/services and PostgreSQL where applicable. Some database fixtures deliberately omit tables
for controlled infrastructure errors; definition-store uses its migrations for startup.
Java used the cached HMCTS Java 21 runtime; Node used public node:22-alpine as non-root node.
These are substitute runtimes, not builds of each exact production Dockerfile.
Artifact hashes and per-check results are in review-reports/CCD-7882/docker-results.json.
Scripts allow repeat runs and results identify what was checked; retaining them is evidence,
not an extra production runtime dependency. Synthetic raw logs are local diagnostics.

Production image/ingress verification, deployed BEFTA/ITHC, actual Azure ingestion, retention
and administrator-only access remain release gates. The local telemetry collector proves the
specific agent/SDK path tested, not production collection settings.
