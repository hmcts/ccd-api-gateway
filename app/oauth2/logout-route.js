const config = require('config');
const COOKIE_ACCESS_TOKEN = require('./oauth2-route').COOKIE_ACCESS_TOKEN;

const logoutRoute = (req, res, next) => {
  const logoutUrl = config.get('idam.logout_url');
  const accessToken = req.cookies && req.cookies[COOKIE_ACCESS_TOKEN];
  
  if (accessToken) {
    res.redirect(`${logoutUrl}?jwt=${accessToken}`);
  } else {
    next({
      error: 'No auth token',
      status: 400,
      message: 'No auth token to log out'
    });
  }
};

module.exports = {
  logoutRoute
};
