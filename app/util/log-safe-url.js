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

const redactUrl = value => {
  if (!value) {
    return value;
  }

  try {
    const absoluteUrl = isAbsoluteUrl(value);
    const parsed = new URL(value, absoluteUrl ? undefined : 'https://gateway.local');

    parsed.searchParams.forEach((queryValue, key) => {
      if (SENSITIVE_QUERY_PARAMETERS.includes(key.toLowerCase())) {
        parsed.searchParams.set(key, 'REDACTED');
      }
    });

    const pathAndQuery = `${parsed.pathname}${parsed.search}`;
    return absoluteUrl ? `${parsed.origin}${pathAndQuery}` : pathAndQuery;
  } catch (error) {
    return value;
  }
};

module.exports = {
  redactUrl
};
