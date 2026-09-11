function requireOAuthEnvironment() {
  const requiredVariables = [
    'IDAM_API_URL',
    'IDAM_OAUTH2_REDIRECT_URI',
    'CCD_CASEWORKER_AUTOTEST_EMAIL',
    'CCD_CASEWORKER_AUTOTEST_PASSWORD'
  ];
  const missing = requiredVariables.filter(name => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(`OAuth authorization-code tests require: ${missing.join(', ')}`);
  }
}

async function obtainAuthorizationCode(request) {
  requireOAuthEnvironment();

  const redirectUri = process.env.IDAM_OAUTH2_REDIRECT_URI;
  const authorizeUrl = new URL('/oauth2/authorize', process.env.IDAM_API_URL);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', process.env.IDAM_OAUTH2_CLIENT_ID || 'ccd_gateway');
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);

  const credentials = Buffer.from(
    `${process.env.CCD_CASEWORKER_AUTOTEST_EMAIL}:${process.env.CCD_CASEWORKER_AUTOTEST_PASSWORD}`
  ).toString('base64');
  const response = await request.post(authorizeUrl.toString(), {
    data: '',
    failOnStatusCode: false,
    headers: {
      Authorization: `Basic ${credentials}`,
      'content-type': 'application/x-www-form-urlencoded'
    }
  });

  if (!response.ok()) {
    throw new Error(`IDAM authorization-code request failed with HTTP ${response.status()} ${response.statusText()}.`);
  }

  const payload = await response.json();
  if (!payload.code) {
    throw new Error('IDAM authorization-code response did not contain a code.');
  }

  return payload.code;
}

function accessTokenCookie(setCookieHeader) {
  const match = setCookieHeader && setCookieHeader.match(/(?:^|,\s*)accessToken=([^;]+)/);
  return match ? match[1] : undefined;
}

export { accessTokenCookie, obtainAuthorizationCode };
