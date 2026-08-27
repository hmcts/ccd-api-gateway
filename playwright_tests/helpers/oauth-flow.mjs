import { IdamPage } from '@hmcts/playwright-common';

function requireOAuthEnvironment() {
  const requiredVariables = [
    'IDAM_WEB_URL',
    'IDAM_OAUTH2_REDIRECT_URI',
    'CCD_CASEWORKER_AUTOTEST_EMAIL',
    'CCD_CASEWORKER_AUTOTEST_PASSWORD'
  ];
  const missing = requiredVariables.filter(name => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(`OAuth browser tests require: ${missing.join(', ')}`);
  }
}

async function obtainAuthorizationCode(page) {
  requireOAuthEnvironment();

  const redirectUri = process.env.IDAM_OAUTH2_REDIRECT_URI;
  const authorizeUrl = new URL('/o/authorize', process.env.IDAM_WEB_URL);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', process.env.IDAM_OAUTH2_CLIENT_ID || 'ccd_gateway');
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('scope', process.env.IDAM_OAUTH2_SCOPE || 'openid profile roles');

  let resolveAuthorizationCode;
  const authorizationCode = new Promise(resolve => {
    resolveAuthorizationCode = resolve;
  });
  const redirectUrl = new URL(redirectUri);
  const redirectPattern = `${redirectUrl.origin}${redirectUrl.pathname}**`;
  const captureRedirect = async route => {
    resolveAuthorizationCode(new URL(route.request().url()).searchParams.get('code'));
    await route.fulfill({ status: 204 });
  };

  await page.context().clearCookies();
  await page.context().route(redirectPattern, captureRedirect);

  try {
    await page.goto(authorizeUrl.toString(), { waitUntil: 'domcontentloaded' });
    const idamPage = new IdamPage(page);

    await idamPage.login({
      username: process.env.CCD_CASEWORKER_AUTOTEST_EMAIL,
      password: process.env.CCD_CASEWORKER_AUTOTEST_PASSWORD
    });
    const capturedCode = await Promise.race([
      authorizationCode,
      page.waitForTimeout(30000).then(() => {
        throw new Error('Timed out waiting for the IDAM authorization redirect.');
      })
    ]);

    if (!capturedCode) {
      throw new Error('IDAM authorization redirect did not contain an authorization code.');
    }

    return capturedCode;
  } finally {
    await page.context().unroute(redirectPattern, captureRedirect);
  }
}

function accessTokenCookie(setCookieHeader) {
  const match = setCookieHeader && setCookieHeader.match(/(?:^|,\s*)accessToken=([^;]+)/);
  return match ? match[1] : undefined;
}

export { accessTokenCookie, obtainAuthorizationCode };
