const { expect } = require('chai');
const { accessTokenCookie } = require('../../playwright_tests/helpers/oauth-flow.mjs');

describe('accessTokenCookie', () => {
  it('should extract an access token from a single cookie', () => {
    expect(accessTokenCookie('accessToken=ey123.ey456; Path=/; HttpOnly')).to.equal('ey123.ey456');
  });

  it('should extract an access token after a cleared state cookie in Playwright headers', () => {
    const header = 'oauth2State=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT\n' +
      'accessToken=ey123.ey456; Path=/; HttpOnly';

    expect(accessTokenCookie(header)).to.equal('ey123.ey456');
  });

  it('should support CRLF-separated cookies', () => {
    expect(accessTokenCookie('oauth2State=; Path=/\r\naccessToken=ey123.ey456; HttpOnly'))
      .to.equal('ey123.ey456');
  });

  it('should support comma-separated cookies containing an expiry date', () => {
    const header = 'oauth2State=; Expires=Thu, 01 Jan 1970 00:00:00 GMT, ' +
      'accessToken=ey123.ey456; HttpOnly';

    expect(accessTokenCookie(header)).to.equal('ey123.ey456');
  });

  it('should stop at the next cookie when the access token has no attributes', () => {
    expect(accessTokenCookie('accessToken=ey123.ey456\noauth2State=state; Path=/')).to.equal('ey123.ey456');
  });

  it('should return undefined when the access token is missing or empty', () => {
    for (const header of [undefined, '', 'oauth2State=state; HttpOnly', 'accessToken=; Path=/',
      'otheraccessToken=value; HttpOnly']) {
      expect(accessTokenCookie(header)).to.equal(undefined);
    }
  });
});
