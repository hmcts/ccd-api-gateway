# Deployed API tests

These Playwright tests send black-box HTTP requests to the gateway identified by `TEST_URL`. They must not import `app.js` or replace downstream services with in-process mocks because their purpose is to prove the deployed release.

The shared fixture uses `@hmcts/playwright-common` for its `ApiClient`, redacted structured logging, correlation IDs and sanitized API-call attachments. Use the same package's `IdamUtils` and `ServiceAuthUtils` when adding authenticated endpoint scenarios rather than implementing local authentication clients.

Use these tags to select the CI phase:

- `@smoke` for fast, non-destructive checks that run after every deployment.
- `@functional` for broader endpoint contract and authentication scenarios.

The deployed suite contains 11 scenarios: one smoke test and ten functional tests covering health, OAuth validation, logout validation, authentication enforcement across five proxy groups and one successful authenticated `/aggregated` request.

## Authenticated scenarios

The shared fixtures expose `authenticatedApiClient` for positive deployed-instance scenarios. It obtains an IDAM access token with `IdamUtils` and adds it as a bearer token to gateway requests. It also sends `Content-Type: application/json`, which the aggregated Data Store endpoint requires even for its GET request. The fixture is lazy: existing health and negative-authentication tests do not require credentials.

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
IDAM_TESTING_SUPPORT_URL
CCD_CASEWORKER_AUTOTEST_EMAIL
CCD_CASEWORKER_AUTOTEST_PASSWORD
CCD_API_GATEWAY_OAUTH2_CLIENT_SECRET
```

Optional overrides are `IDAM_OAUTH2_CLIENT_ID`, `IDAM_OAUTH2_SCOPE` and `IDAM_OAUTH2_REDIRECT_URI`. Defaults are suitable for the `ccd_gateway` client except for the environment-specific redirect URI.

The first CI verification uses this fixture to request `/aggregated/caseworkers/:uid/jurisdictions?access=read`. It expects a successful response containing `AUTOTEST1`, which verifies the configured identity's `caseworker` and `caseworker-autotest1` access as well as gateway user-ID substitution, S2S injection and downstream proxying.

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

Unauthenticated tests can therefore run against a local gateway, a disposable stub server, Preview or AAT. Authenticated tests must use credentials and IDAM URLs belonging to the same backing environment as the deployed gateway. Never commit those values to an `.env` file.

Set `PLAYWRIGHT_IGNORE_HTTPS_ERRORS=true` only for an environment that deliberately uses an untrusted test certificate. TLS verification remains enabled by default.
