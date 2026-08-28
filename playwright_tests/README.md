# Deployed API tests

These Playwright tests send black-box HTTP requests to the gateway identified by `TEST_URL`. They must not import `app.js` or replace downstream services with in-process mocks because their purpose is to prove the deployed release.

The shared fixture uses `@hmcts/playwright-common` for its `ApiClient`, redacted structured logging, correlation IDs and sanitized API-call attachments. Use the same package's `IdamUtils` and `ServiceAuthUtils` when adding authenticated endpoint scenarios rather than implementing local authentication clients.

Use these tags to select the CI phase:

- `@smoke` for fast, non-destructive checks that run after every deployment.
- `@functional` for broader endpoint contract and authentication scenarios.

Name deployed test files by scenario intent:

- `*.positive.spec.mjs` for successful responses and expected business contracts.
- `*.negative.spec.mjs` for authentication, validation, error and failure responses.

Do not mix positive and negative scenarios in the same spec file. This keeps CI failures and report evidence easy to classify.

Keep helper functions out of `*.spec.mjs` files. Put response parsing, data builders and reusable request lifecycle logic under `playwright_tests/helpers`, leaving specs focused on scenarios and assertions.

The deployed suite contains 21 scenarios: two smoke tests and nineteen functional tests covering health, positive OAuth authorization-code exchange, OAuth validation, positive and negative logout, address lookup, authentication enforcement across five proxy groups, successful authenticated requests through `/aggregated`, `/data`, `/definition_import` and `/documents`, and downstream health through `/activity`, `/print` and `/refdata`.

Positive deployed coverage now covers 14 of the 17 endpoint routes or groups (82.4%), an increase of 58.9 percentage points from the 23.5% baseline: `/`, `/health`, `/health/readiness`, `/health/liveness`, `/oauth2`, `/logout`, `/addresses`, `/aggregated`, `/data`, `/definition_import`, `/documents`, `/activity`, `/print` and `/refdata`. Successful `/em-anno`, `/payments` and `/pay-bulkscan` scenarios still require dedicated resource fixtures and roles.

## Authenticated scenarios

The shared fixtures expose `authenticatedApiClient` for positive deployed-instance scenarios. It obtains an IDAM access token with `IdamUtils` and adds it as a bearer token to gateway requests. It also sends `Content-Type: application/json`, which the aggregated Data Store endpoint requires even for its GET request. `authenticatedRequestContext` uses the same token with Playwright's native request context for multipart uploads, which the common API client does not currently expose. The `freshIdamAccessToken` fixture issues a test-scoped token for logout so invalidating it cannot affect the worker-scoped token used by other tests. The fixtures are lazy: health and negative-authentication tests do not require credentials.

Jenkins reads the test identity and OAuth client secret from the environment-specific `ccd-${env}` Key Vault. Preview is deliberately mapped to AAT because Preview gateway deployments use AAT IDAM.

| Key Vault secret | Environment variable | Purpose |
|---|---|---|
| `ccd-caseworker-autotest-email` | `CCD_CASEWORKER_AUTOTEST_EMAIL` | Existing CCD automation identity |
| `ccd-caseworker-autotest-password` | `CCD_CASEWORKER_AUTOTEST_PASSWORD` | Automation identity password |
| `ccd-api-gateway-oauth2-client-secret` | `CCD_API_GATEWAY_OAUTH2_CLIENT_SECRET` | Password-grant OAuth client authentication |

The identity is expected to have these roles:

- `caseworker` for standard caseworker paths.
- `caseworker-autotest1` for meaningful access to the AUTOTEST1 jurisdiction.
- `ccd-import` only for definition-import operations; it is not required for read-only display requests.

Prefer non-destructive positive requests, initially across `/aggregated`, `/data` and `/definition_import`. Document and payment tests also need a resource owned by or accessible to the test identity; roles alone do not guarantee access. `/print/probateManTypes` is a special gateway case and requires `caseworker-probate` or `caseworker-probate-issuer`, so it should use a dedicated Probate identity rather than broadening this shared user.

The authentication fixture requires:

```text
TEST_URL
IDAM_WEB_URL
IDAM_API_URL
IDAM_TESTING_SUPPORT_URL
CCD_CASEWORKER_AUTOTEST_EMAIL
CCD_CASEWORKER_AUTOTEST_PASSWORD
CCD_API_GATEWAY_OAUTH2_CLIENT_SECRET
```

Optional overrides are `IDAM_OAUTH2_CLIENT_ID`, `IDAM_OAUTH2_SCOPE` and `IDAM_OAUTH2_REDIRECT_URI`. Defaults are suitable for the `ccd_gateway` client except for the environment-specific redirect URI.

The positive CI verifications use these fixtures for requests through `/addresses`, `/aggregated`, `/data`, `/definition_import`, `/documents`, `/activity`, `/print` and `/refdata`, plus a token-isolated logout request. The Data Store requests expect `AUTOTEST1`, verifying the configured identity's `caseworker` and `caseworker-autotest1` access as well as gateway user-ID substitution, S2S injection and downstream proxying. The Definition Store request verifies its JSON response contract without importing or changing definitions. The document scenario uploads a uniquely named tiny text file and permanently deletes it in a `finally` block. The downstream health checks prove gateway authentication, S2S generation, path rewriting and connectivity without depending on mutable case or payment data.

Example usage:

```js
test('authenticated gateway request @functional', async ({ authenticatedApiClient }) => {
  const response = await authenticatedApiClient.get(
    '/aggregated/caseworkers/:uid/jurisdictions',
    { query: { access: 'read' } }
  );

  expect(response.status).toBe(200);
});
```

Run all deployed tests locally against an available environment:

```bash
TEST_URL=https://ccd-api-gateway-web.example.test yarn test:deployed
```

The positive OAuth scenario obtains a real one-time authorization code from the IDAM API and exchanges it through the deployed gateway. The deployed suite uses Playwright's API request client throughout, so it does not require a browser installation.

Unauthenticated tests can therefore run against a local gateway, a disposable stub server, Preview or AAT. Authenticated tests must use credentials and IDAM URLs belonging to the same backing environment as the deployed gateway. Never commit those values to an `.env` file.

Set `PLAYWRIGHT_IGNORE_HTTPS_ERRORS=true` only for an environment that deliberately uses an untrusted test certificate. TLS verification remains enabled by default.
