const SENSITIVE_QUERY_PARAMETERS = [
  'access_token',
  'authorization',
  'client_secret',
  'code',
  'id_token',
  'onetimepassword',
  'password',
  'refresh_token',
  'state',
  'token'
];

const isAbsoluteUrl = value => /^[a-z][a-z\d+\-.]*:\/\//i.test(value);

const redactQueryString = search => {
  const searchParams = new URLSearchParams(search);

  searchParams.forEach((queryValue, key) => {
    if (SENSITIVE_QUERY_PARAMETERS.includes(key.toLowerCase())) {
      searchParams.set(key, 'REDACTED');
    }
  });

  const redactedSearch = searchParams.toString();
  return redactedSearch ? `?${redactedSearch}` : '';
};

const redactRelativeUrl = value => {
  const fragmentStart = value.indexOf('#');
  const valueWithoutFragment = fragmentStart === -1 ? value : value.slice(0, fragmentStart);
  const fragment = fragmentStart === -1 ? '' : value.slice(fragmentStart);
  const queryStart = valueWithoutFragment.indexOf('?');

  if (queryStart === -1) {
    return value;
  }

  const path = valueWithoutFragment.slice(0, queryStart);
  const query = valueWithoutFragment.slice(queryStart + 1);

  return `${path}${redactQueryString(query)}${fragment}`;
};

const redactUrl = value => {
  if (!value) {
    return value;
  }

  try {
    const absoluteUrl = isAbsoluteUrl(value);
    if (!absoluteUrl) {
      return redactRelativeUrl(value);
    }

    const parsed = new URL(value);
    const pathAndQuery = `${parsed.pathname}${redactQueryString(parsed.search)}`;
    return `${parsed.origin}${pathAndQuery}`;
  } catch (error) {
    return value;
  }
};

module.exports = {
  redactUrl
};
