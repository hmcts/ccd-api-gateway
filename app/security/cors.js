const config = require('config');
const sanitize = require('../util/sanitize');

const WILDCARD = '*';

const createWhitelistValidator = (val) => {
    const whitelist = config.get('security.cors_origin_whitelist').split(',');
    for (let w of whitelist) {
        if (val === w || WILDCARD === w) {
            return true;
        }
    }
    return false;
};

const corsOptions = {
    allowOrigin: createWhitelistValidator,
    allowCredentials: true,
    allowMethods: config.get('security.cors_origin_methods')
};

const handleCors = (req, res, next) => {
    if (corsOptions.allowOrigin) {
        const origin = req.get('origin');
        if (corsOptions.allowOrigin(origin)) {
            res.set('Access-Control-Allow-Origin', sanitize.sanitizeData(origin));
        }
    } else {
        res.set('Access-Control-Allow-Origin', '*');
    }
    if (corsOptions.allowCredentials) {
        res.set('Access-Control-Allow-Credentials', corsOptions.allowCredentials);
    }
    if (corsOptions.allowMethods) {
        res.set('Access-Control-Allow-Methods', corsOptions.allowMethods);
    }
    res.set('Access-Control-Allow-Headers', sanitize.sanitizeData(req.get('Access-Control-Request-Headers')));
    if('OPTIONS' === req.method) {
        res
            .status(200)
            .end();
    } else {
        next();
    }
};

module.exports = handleCors;
