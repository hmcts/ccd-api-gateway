const handleHSTS = (req, res, next) => {
    res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
};

module.exports = handleHSTS;
