const config = require('config');
const regOrigin = require('../util/sanitize');
const regHeaders = require('../util/sanitize');

const WILDCARD = '*';

const createWhitelistValidator = (val) => {
    const whitelist = config.get('security.cors_origin_whitelist').split(',');
    for (var i = 0; i < whitelist.length; i++) {
        if (val === whitelist[i] || WILDCARD === whitelist[i]) {
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
        var origin = req.get('origin');
        if (corsOptions.allowOrigin(origin) && regOrigin(origin)) {
            res.set('Access-Control-Allow-Origin', origin);
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
    if (regHeaders(req.get('Access-Control-Request-Headers'))){
        res.set('Access-Control-Allow-Headers', req.get('Access-Control-Request-Headers'));
    }
    
    if('OPTIONS' === req.method) {
        res
            .status(200)
            .end();
    } else {
        next();
    }
};

module.exports = handleCors;
