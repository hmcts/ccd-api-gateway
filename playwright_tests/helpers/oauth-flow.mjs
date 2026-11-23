function requireOAuthEnvironment() {
  const requiredVariables = [
    'IDAM_WEB_URL',
    'IDAM_OAUTH2_REDIRECT_URI',
    'CCD_CASEWORKER_AUTOTEST_EMAIL',
    'CCD_CASEWORKER_AUTOTEST_PASSWORD'
  ];
  const missing = requiredVariables.filter(name => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(`OAuth authorization-code tests require: ${missing.join(', ')}`);
  }
}

// Fetch real IdAM responses, changing only a redirect to the frontend callback
// into a redirect to the gateway. Its code and state remain unchanged.
async function completeBrowserAuthorization(page, state) {
  requireOAuthEnvironment();
  const { IdamPage } = await import('@hmcts/playwright-common');
  const redirectUri = new URL(process.env.IDAM_OAUTH2_REDIRECT_URI);
  const gatewayCallback = new URL('/oauth2', process.env.TEST_URL);
  const idamOrigin = new URL(process.env.IDAM_WEB_URL).origin;
  let returnedState;

  await page.route(url => url.origin === idamOrigin, async route => {
    const response = await route.fetch({ maxRedirects: 0 });
    const location = response.headers().location;
    const target = location && new URL(location, response.url());
    if (target && target.origin === redirectUri.origin && target.pathname === redirectUri.pathname) {
      returnedState = target.searchParams.get('state');
      gatewayCallback.search = target.search;
      gatewayCallback.searchParams.set('redirect_uri', redirectUri.href);
      await route.fulfill({ response, headers: { ...response.headers(), location: gatewayCallback.href } });
    } else {
      await route.fulfill({ response });
    }
  });

  const authorizeUrl = new URL('/login', process.env.IDAM_WEB_URL);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', process.env.IDAM_OAUTH2_CLIENT_ID || 'ccd_gateway');
  authorizeUrl.searchParams.set('redirect_uri', redirectUri.href);
  authorizeUrl.searchParams.set('state', state);

  await page.goto(authorizeUrl.href);
  const loginPage = new IdamPage(page);
  await loginPage.usernameInput.fill(process.env.CCD_CASEWORKER_AUTOTEST_EMAIL);
  if (!await loginPage.passwordInput.isVisible()) {
    await loginPage.visibleSubmitBtn.click();
    await loginPage.passwordInput.waitFor({ state: 'visible' });
  }
  await loginPage.passwordInput.fill(process.env.CCD_CASEWORKER_AUTOTEST_PASSWORD);
  const [response] = await Promise.all([
    page.waitForResponse(response => {
      const url = new URL(response.url());
      return url.origin === gatewayCallback.origin && url.pathname === gatewayCallback.pathname;
    }),
    // The gateway returns 204, so this navigation never commits a new document.
    loginPage.visibleSubmitBtn.click({ noWaitAfter: true })
  ]);
  return { response, returnedState };
}

function accessTokenCookie(setCookieHeader) {
  const match = setCookieHeader && setCookieHeader.match(/(?:^|[,\r\n]\s*)accessToken=([^;\r\n]+)/);
  return match ? match[1] : undefined;
}

export { accessTokenCookie, completeBrowserAuthorization };
