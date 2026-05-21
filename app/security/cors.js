const config = require('config');
const sanitize = require('../util/sanitize');

const escapeRegex = (str) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ALLOWED_HEADERS = ['content-type', 'authorization'];

const isOriginAllowed = (origin) => {
  if (typeof origin !== 'string') return false;

  const whitelist = config
    .get('security.cors_origin_whitelist')
    .split(',')
    .map(w => w.trim());

  if (whitelist.includes('*')) {
    throw new Error('CORS whitelist cannot contain "*"');
  }

  return whitelist.some(w => {
    if (w === origin) return true;

    if (w.includes('*')) {
      const pattern =
        '^' +
        escapeRegex(w).replace(/\\\*/g, '[^.]+') +
        '$';

      return new RegExp(pattern).test(origin);
    }

    return false;
  });
};

const resolveAllowedHeaders = (req) => {
  const requested = req.get('Access-Control-Request-Headers');

  if (!requested) return 'Content-Type, Authorization';

  const filtered = requested
    .split(',')
    .map(h => h.trim())
    .filter(h => ALLOWED_HEADERS.includes(h.toLowerCase()))
    .join(', ');

  return filtered || 'Content-Type, Authorization';
};

const handleCors = (req, res, next) => {
  const origin = req.get('origin');

  if (!origin || !isOriginAllowed(origin)) {
    return res.status(403).end();
  }

  res.set('Access-Control-Allow-Origin', sanitize.sanitizeData(origin));
  res.set('Access-Control-Allow-Credentials', true);
  res.set('Access-Control-Allow-Methods', config.get('security.cors_origin_methods'));
  res.set('Access-Control-Allow-Headers', resolveAllowedHeaders(req));
  res.set('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
};

module.exports = handleCors;
