#!/usr/bin/env bash
set +e
yarn audit --groups dependencies
result=$?
set -e

if [[ "$result" != 0 ]]; then
  if [[ -f ccd-yarn-audit-known-issues ]]; then
    set +e
    yarn audit --groups dependencies --json | grep auditAdvisory > yarn-audit-issues
    set -e
    new_vulnerabilities=false
    while read -r line; do
        url=$(node -pe 'JSON.parse(process.argv[1]).data.advisory.url' "$line")
        if ! grep -q "$url" ccd-yarn-audit-known-issues; then
          echo "unknown vulnerability:$url"
          new_vulnerabilities=true
        fi
    done < yarn-audit-issues

    if [[ "$new_vulnerabilities" = true ]] ; then
      echo
      echo Security vulnerabilities were found that were not ignored
      echo
      echo Check to see if these vulnerabilities apply to production
      echo and/or if they have fixes available. If they do not have
      echo fixes and they do not apply to production, you may ignore them
      echo
      echo To ignore these vulnerabilities, please add advisories urls
      echo "to ccd-yarn-audit-known-issues (eg: https://npmjs.com/advisories/755)"
      echo
      echo and commit the ccd-yarn-audit-known-issues file.

      exit "$result"
    fi

    fi
fi
