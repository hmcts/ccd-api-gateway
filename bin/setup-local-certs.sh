#!/usr/bin/env bash
set -euo pipefail

secret_dir="app/resources/localhost-ssl/"
mkdir -p "$secret_dir"
chmod 700 "$secret_dir"

if [[ ! -f "$secret_dir/localhost.key" || ! -f "$secret_dir/localhost.crt" ]]; then
  openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
    -keyout "$secret_dir/localhost.key" \
    -out "$secret_dir/localhost.crt" \
    -subj "/CN=localhost" >/dev/null 2>&1
  chmod 600 "$secret_dir/localhost.key" "$secret_dir/localhost.crt"
fi
