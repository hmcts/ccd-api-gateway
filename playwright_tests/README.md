# Deployed API tests

These Playwright tests send black-box HTTP requests to the gateway identified by `TEST_URL`. They must not import `app.js` or replace downstream services with in-process mocks because their purpose is to prove the deployed release.

Use these tags to select the CI phase:

- `@smoke` for fast, non-destructive checks that run after every deployment.
- `@functional` for authenticated or stateful endpoint scenarios.

Run all deployed tests locally against an available environment:

```bash
TEST_URL=https://ccd-api-gateway-web.example.test yarn test:deployed
```

Set `PLAYWRIGHT_IGNORE_HTTPS_ERRORS=true` only for an environment that deliberately uses an untrusted test certificate. TLS verification remains enabled by default.
