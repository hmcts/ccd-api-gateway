const config = require('config');

const handleTiming = (req, res, next) => {
  res.set('Timing-Allow-Origin', config.get('security.timing-allow-origin'));
  next();
};

module.exports = handleTiming;


