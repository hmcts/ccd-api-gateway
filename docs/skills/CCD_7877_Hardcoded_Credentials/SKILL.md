# CCD-7877 Hardcoded Credentials

## Objective

Remove the tracked private key and externalise runtime credentials while preserving safe local development.

## Acceptance criteria

- No private key is tracked.
- Runtime credentials use environment or managed-secret injection.
- Local HTTPS uses ignored, locally managed certificate files.
- No live credential rotation is performed by this change.

## Validation

- Node syntax and Compose interpolation checks passed.
- Full Docker runtime validation remains outstanding.

## Scope and findings

Remediation status: the tracked key has now been removed from this branch. Local HTTPS uses `HTTPS_CERT_PATH` and `HTTPS_KEY_PATH`; no live credential rotation was performed.

- `app/resources/localhost-ssl/localhost.key` is a tracked PEM RSA private key, added in history on 2018-03-17 during open sourcing.
- `server.js` reads externally supplied certificate and key paths for local HTTPS; it no longer reads bundled key material.
- Existing secret-to-environment mappings include `IDAM_OAUTH2_CLIENT_SECRET`, `ADDRESS_LOOKUP_TOKEN`, `IDAM_SERVICE_KEY`, and `APPINSIGHTS_INSTRUMENTATIONKEY`.
- Prior history includes secret-removal work, but not evidence of private-key rotation.

## Validity and deployment

- Current validity: **not confirmed**; no live authentication or secret-store access was available.
- Deployment/runtime: repository evidence only; Helm/Terraform and environment-backed configuration exist, but live pods, CI variables, and cloud secret stores were not accessible.
- Rotation: **not confirmed** for the key or reported credentials.

## Recommendations

Treat the key and reported credentials as compromised. Revoke/rotate through the owning systems, remove the key from source and history, and use runtime-mounted secrets or managed TLS. Continue using the existing environment variables; if a runtime key is required, use `HTTPS_KEY_PATH` and `HTTPS_CERT_PATH`. Verify live secret-store references, deployed pods, CI/CD variables, and rotation records before closure.

## Local operation

Local HTTPS is now externalised. When running standalone, provide `HTTPS_CERT_PATH` and `HTTPS_KEY_PATH` to locally managed files. When using the CCD Docker stack, run `ccd-docker/bin/setup-local-secrets.sh`; it creates ignored local values and certificate files for the stack. No approved fixed-defaults-file fallback is currently implemented.
