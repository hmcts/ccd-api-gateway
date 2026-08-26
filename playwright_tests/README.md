# Deployed API tests

These Playwright tests send black-box HTTP requests to the gateway identified by `TEST_URL`. They must not import `app.js` or replace downstream services with in-process mocks because their purpose is to prove the deployed release.

The shared fixture uses `@hmcts/playwright-common` for its `ApiClient`, redacted structured logging, correlation IDs and sanitized API-call attachments. Use the same package's `IdamUtils` and `ServiceAuthUtils` when adding authenticated endpoint scenarios rather than implementing local authentication clients.

Use these tags to select the CI phase:

- `@smoke` for fast, non-destructive checks that run after every deployment.
- `@functional` for broader endpoint contract and authentication scenarios.

The initial deployed suite contains 10 scenarios: one smoke test and nine functional tests covering health, OAuth validation, logout validation and authentication enforcement across five proxy groups.

Run all deployed tests locally against an available environment:

```bash
TEST_URL=https://ccd-api-gateway-web.example.test yarn test:deployed
```

Set `PLAYWRIGHT_IGNORE_HTTPS_ERRORS=true` only for an environment that deliberately uses an untrusted test certificate. TLS verification remains enabled by default.
