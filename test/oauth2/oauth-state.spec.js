const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const { OAUTH_STATE_TTL_MS } = require('../../app/oauth2/oauth-state');

describe('OAuth state transactions', () => {
  let clock;
  let setOAuthState;
  let consumeOAuthState;

  beforeEach(() => {
    clock = sinon.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    ({ setOAuthState, consumeOAuthState } = proxyquire('../../app/oauth2/oauth-state', {}));
  });

  afterEach(() => clock.restore());

  it('should generate distinct cryptographically random states', () => {
    const req = {};
    const first = setOAuthState(req);
    const second = setOAuthState(req);

    expect(first).to.match(/^[a-f0-9]{64}$/);
    expect(second).to.match(/^[a-f0-9]{64}$/);
    expect(first).not.to.equal(second);
  });

  it('should reject replay even when the original browser cookies are restored', () => {
    const req = { cookies: {} };
    const state = setOAuthState(req);
    const originalCookies = { ...req.cookies };

    expect(consumeOAuthState(req, state)).to.equal(true);
    expect(consumeOAuthState({ cookies: originalCookies }, state)).to.equal(false);
  });

  it('should accept a transaction just before it expires', () => {
    const req = {};
    const state = setOAuthState(req);
    clock.tick(OAUTH_STATE_TTL_MS - 1);

    expect(consumeOAuthState(req, state)).to.equal(true);
  });

  it('should reject a transaction at its expiry even with the original cookies', () => {
    const req = {};
    const state = setOAuthState(req);
    clock.tick(OAUTH_STATE_TTL_MS);

    expect(consumeOAuthState(req, state)).to.equal(false);
  });

  it('should not extend an earlier transaction lifetime when starting another login', () => {
    const req = {};
    const first = setOAuthState(req);
    clock.tick(OAUTH_STATE_TTL_MS / 2);
    const second = setOAuthState(req);
    clock.tick(OAUTH_STATE_TTL_MS / 2);

    expect(consumeOAuthState(req, first)).to.equal(false);
    expect(consumeOAuthState(req, second)).to.equal(true);
  });

  it('should preserve parallel logins across independent requests from the same browser', () => {
    const req = { cookies: {} };
    const first = setOAuthState(req);
    const otherTab = { cookies: { ...req.cookies } };
    const second = setOAuthState(otherTab);
    const browser = { cookies: { ...req.cookies, ...otherTab.cookies } };

    expect(consumeOAuthState(browser, second)).to.equal(true);
    expect(consumeOAuthState(browser, first)).to.equal(true);
  });

  it('should reject invalid input without consuming pending transactions', () => {
    const req = {};
    const first = setOAuthState(req);
    const second = setOAuthState(req);

    for (const invalid of [undefined, null, '', 'unknown', [first], { state: first }]) {
      expect(consumeOAuthState(req, invalid)).to.equal(false);
    }

    expect(consumeOAuthState(req, first)).to.equal(true);
    expect(consumeOAuthState(req, second)).to.equal(true);
  });

  it('should reject missing or unrelated browser cookies without consuming the owner state', () => {
    const owner = {};
    const state = setOAuthState(owner);
    const otherBrowser = {};
    setOAuthState(otherBrowser);

    expect(consumeOAuthState({}, state)).to.equal(false);
    expect(consumeOAuthState({ cookies: null }, state)).to.equal(false);
    expect(consumeOAuthState(otherBrowser, state)).to.equal(false);
    expect(consumeOAuthState(owner, state)).to.equal(true);
  });

  it('should reject new logins at capacity without invalidating pending transactions', () => {
    const owner = {};
    const state = setOAuthState(owner);
    for (let index = 1; index < 10000; index += 1) {
      setOAuthState({});
    }
    expect(() => setOAuthState({})).to.throw('Cache max keys amount exceeded');
    expect(consumeOAuthState(owner, state)).to.equal(true);
    expect(() => setOAuthState({})).not.to.throw();
  });

  it('should automatically reclaim expired capacity without callbacks', () => {
    for (let index = 0; index < 10000; index += 1) {
      setOAuthState({});
    }
    clock.tick(OAUTH_STATE_TTL_MS + 60000);
    expect(() => setOAuthState({})).not.to.throw();
  });
});
