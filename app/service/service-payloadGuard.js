const {Logger} = require('@hmcts/nodejs-logging');

function payloadGuard(opts) {
  const logger = Logger.getLogger('payloadGuard');

  const {
    allowContentTypes = ['application/json'],
    rejectPathTraversal = true,
    rejectObviousScriptTags = true,
    maxArrayLength = 10000,
    maxDepth = 40
  } = opts || {};

  return (req, res, next) => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = (req.headers['content-type'] || '').split(';')[0].trim();
      if (allowContentTypes.length && !allowContentTypes.includes(contentType)) {
        logger.warn(`Invalid content-type: ${contentType}`);
        return res.status(415).json({
          status: 415,
          error: 'Unsupported Media Type'
        });
      }

      if (rejectPathTraversal && isSuspiciousPath(req.url || '')) {
        logger.warn(`Path traversal attempt: ${req.url || ''}`);
        return res.status(400).json({message: 'Invalid path'});
      }

      if (req.body && typeof req.body === 'object') {
        const seen = new Set();
        let depth = 0;
        let tooBig = false;

        (function walk(v, d) {
          if (tooBig || d > maxDepth) {
            tooBig = true;
            return;
          }
          if (v && typeof v === 'object') {
            if (seen.has(v)) return; // cycles
            seen.add(v);
            if (Array.isArray(v) && v.length > maxArrayLength) {
              tooBig = true;
              return;
            }
            for (const k of Object.keys(v)) walk(v[k], d + 1);
          }
        })(req.body, depth);

        if (tooBig) {
          logger.warn('Payload too large or too deeply nested');
          return res.status(413).json({message: 'Payload too large or too deeply nested'});
        }

      }

      if (rejectObviousScriptTags) {
        const hasScript = containsScriptTag(req.body);
        if (hasScript) {
          logger.warn('Payload contains disallowed content');
          return res.status(400).json({message: 'Payload contains disallowed content'});
        }
      }
    }
    next();
  };
}

function safeDecodeURIComponent(value) {
  return String(value).replace(/%[0-9a-fA-F]{2}/g, m => {
    const code = parseInt(m.slice(1), 16);
    return String.fromCharCode(code);
  });
}

function extractPath(rawUrl) {
  const noHash = rawUrl.split('#', 1)[0];
  return noHash.split('?', 1)[0];
}

function isSuspiciousPath(rawUrl) {
  const pathname = extractPath(rawUrl);
  const decodedRaw = safeDecodeURIComponent(rawUrl);
  const decodedPath = safeDecodeURIComponent(pathname);

  return (
    rawUrl.includes('..') ||
    decodedRaw.includes('..') ||
    pathname.includes('..') ||
    pathname.includes('\\') ||
    decodedPath.includes('..') ||
    decodedPath.includes('\\') ||
    decodedRaw.includes('\\') ||
    rawUrl.includes('\\') ||
    /%2e|%2f|%5c/i.test(rawUrl) ||
    /%2e|%2f|%5c/i.test(pathname)
  );
}

function containsScriptTag(obj) {
  const re = /<\s*script\b|javascript:/i;
  const stack = [obj];
  while (stack.length) {
    const cur = stack.pop();
    if (typeof cur === 'string') {
      if (re.test(cur)) return true;
    } else if (cur && typeof cur === 'object') {
      for (const k in cur) stack.push(cur[k]);
    }
  }
  return false;
}

module.exports = payloadGuard;
