#!/usr/bin/env bash
set +e
yarn audit
result=$?
set -e

if [[ "$result" != 0 ]]; then
  if [[ -f yarn-audit-known-issues ]]; then
    set +e
    yarn audit --json | grep auditAdvisory > yarn-audit-issues
    set -e

    while read -r line; do
        url=$(jq -r '.data.advisory.url' <<< "$line")
        if grep -q "$url" yarn-audit-known-issues; then
            echo "known vulnerability:$url"
        else
          echo
          echo Security vulnerabilities were found that were not ignored
          echo
          echo Check to see if these vulnerabilities apply to production
          echo and/or if they have fixes available. If they do not have
          echo fixes and they do not apply to production, you may ignore them
          echo
          echo To ignore these vulnerabilities, please add advisories urls to yarn-audit-known-issues
          echo
          echo and commit the yarn-audit-known-issues file

          exit "$result"
        fi
    done < yarn-audit-issues
    fi
fi
