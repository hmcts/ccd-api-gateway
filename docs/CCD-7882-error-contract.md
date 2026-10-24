# CCD-7882: controlled error responses

## Current support logging policy

Public error responses remain generic. Detailed request failures, including exception causes
and stack traces, are retained at normal WARN/ERROR levels in server logs; DEBUG is optional
additional troubleshooting. Dependency and health diagnostics retain their originating severity
and respect the source logger threshold. Support must not need to enable DEBUG and reproduce
an incident to obtain its original failure details.

This policy supersedes the DEBUG-only descriptions and test expectations in earlier verification
entries below. Those entries describe historical checks. Deployment acceptance still requires
administrator-only log access, suitable retention and verification of logging/Application Insights
collection. Local tests do not establish those infrastructure controls.


Branch `CCD-7882_Verbose_Error_Messages` was created from local `master` on 20 October 2026.

The final middleware always returns a generic status/error/message/code body, including in development. Fetch/S2S diagnostic text is removed from public errors; original fetch details are available through the existing DEBUG namespace. Proxy fetch failures use the same safe body. The existing direct-fetch fallback had HTTP 500 with body status 504; the body now correctly reports 500.

Error categories: INVALID_REQUEST (400/422), AUTHENTICATION_REQUIRED (401), ACCESS_DENIED (403), RESOURCE_NOT_FOUND (404), METHOD_NOT_ALLOWED (405), REQUEST_TOO_LARGE (413), UNSUPPORTED_MEDIA_TYPE (415), TOO_MANY_REQUESTS (429), INTERNAL_ERROR (5xx), otherwise REQUEST_FAILED. Codes describe categories, not individual incidents. Boot fallback and empty security responses do not promise a category code.

## Local verification

39 focused Mocha tests passed; ESLint passed for the changed files. Tests cover public middleware in development, malformed JSON, fetch failures, S2S failures and committed responses.

## Deployment handoff

These are local source/test results. Deployed BEFTA/ITHC, ingress/upstream error pages and actual dependency failures still require retesting. Do not infer restricted log access, Application Insights collection or production deployment from these checks. Existing internal diagnostics may contain sensitive information; use the existing restricted access controls. Authentication validation, endpoint permissions and successful responses were not deliberately changed.

## Review fixes

42 focused tests passed; ESLint passed for the new application-wiring suite. The added tests load app.js with dependency/authentication boundaries stubbed, use a real refused local upstream connection through the proxy callback, and exercise authentication-error and address-route failures through the final middleware. They do not validate real IDAM/S2S credentials or deployed ingress.

## Authoritative remediation and support requirement

The supplied CCD-7882 finding concerns unauthenticated disclosure of implementation details
through HTTP error responses. This note covers the remediation and verification for this service.

The remediation requires generic public error pages/responses and states: "The server should
still log the detailed information, but access to the log will be restricted to administrators."
An event reference is optional. It does not prescribe DEBUG-only logging or require support
to restart a service to obtain diagnostics.

Response sanitisation and administrator diagnostics are separate requirements. DEBUG-only
implementation details described elsewhere in this note record the implementation, not an
acceptance criterion from the finding. If production DEBUG is disabled and no other approved
mechanism records the detailed failure, that is a support/acceptance gap: enabling DEBUG after
an incident cannot recover its missing diagnostics. A safe category/status summary alone does
not satisfy the detailed-log requirement.

Before release, verify that detailed failures are recorded and accessible only to administrators,
including the deployed logging/Application Insights configuration, while public responses stay
generic. Preserve useful validation responses and existing protocol behaviour. Select and test
the logging policy against these requirements; do not assume that moving every diagnostic to
ERROR, or enabling DEBUG globally, is the required solution. Existing local test results do not
establish this deployed acceptance. This requirement also applies to the current support logging policy above.

## Support logging verification — 21 October 2026

44 focused tests passed, zero failures/errors/skips. Checks cover the applicable request/error
paths and confirm that public responses remain sanitised while original exception diagnostics
are retained without enabling DEBUG. ESLint for the changed files passed.
Direct proxy callbacks also retain the original failure details in server logs.
Administrator-only log access, retention and deployed collection remain environment acceptance checks.

## Logging uniqueness review — 21 October 2026

46 focused tests passed with DEBUG disabled and again with DEBUG enabled. The final middleware owns authentication diagnostics, preserving the original cause without serialising it. Direct proxy responses retain their own diagnostic. Expected client failures use WARN; server failures use ERROR.
