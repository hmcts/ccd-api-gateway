const { randomBytes } = require('crypto');
const NodeCache = require('node-cache');

const OAUTH_STATE_COOKIE_PREFIX = 'oauth2State';
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

// Only transactions issued by this process are accepted. A restart fails closed;
// multiple instances require affinity or a shared store with atomic consumption.
const pendingStates = new NodeCache({
  stdTTL: OAUTH_STATE_TTL_MS / 1000,
  checkperiod: 60,
  maxKeys: 10000,
  useClones: false
});

const generateOAuthState = () => randomBytes(32).toString('hex');
const getOAuthStateCookieName = state => `${OAUTH_STATE_COOKIE_PREFIX}_${state}`;

const setOAuthState = req => {
  const now = Date.now();
  if (!req.cookies) {
    req.cookies = {};
  }

  // The gateway has no session middleware. A separate browser-binding cookie
  // per transaction also preserves simultaneous logins in a fresh browser.
  const sessionId = generateOAuthState();
  const state = generateOAuthState();
  pendingStates.set(state, { sessionId, expiresAt: now + OAUTH_STATE_TTL_MS });
  req.cookies[getOAuthStateCookieName(state)] = sessionId;

  return state;
};

const consumeOAuthState = (req, state) => {
  if (typeof state !== 'string' || !state) {
    return false;
  }

  const transaction = pendingStates.get(state);
  if (!transaction || transaction.sessionId !== (req.cookies && req.cookies[getOAuthStateCookieName(state)])) {
    return false;
  }

  // Consume synchronously before the token exchange, even if the exchange fails.
  // Replaying an earlier browser cookie cannot restore this transaction.
  pendingStates.del(state);

  return transaction.expiresAt > Date.now();
};

module.exports = {
  OAUTH_STATE_COOKIE_PREFIX,
  OAUTH_STATE_TTL_MS,
  generateOAuthState,
  getOAuthStateCookieName,
  setOAuthState,
  consumeOAuthState
};
