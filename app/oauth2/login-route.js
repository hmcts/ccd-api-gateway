const config = require('config');
const { randomBytes } = require('crypto');

const loginRoute = (req, res) => {
  const state = randomBytes(32).toString('hex');
  req.session.oauthState = state;

  const redirectUri = encodeURIComponent(`${req.protocol}://${req.get('host')}/oauth2`);
  const authorizationEndpoint = config.get('idam.oauth2.authorization_endpoint');
  const clientId = config.get('idam.oauth2.client_id');

  res.redirect(302,
    `${authorizationEndpoint}?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${encodeURIComponent(state)}`
  );
};

module.exports = { loginRoute };
