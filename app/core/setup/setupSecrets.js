const config = require('config');
const { get, set } = require('lodash');

const setSecret = (secretPath, configPath) => {
  // Only overwrite the value if the secretPath is defined
  if (config.has(secretPath)) {
    set(config, configPath, get(config, secretPath));
  }
};

const setup = () => {
  if (config.has('secrets.ccd')) {
    setSecret('secrets.ccd.ccd-api-gateway-oauth2-client-secret', 'secrets.ccd.ccd-api-gateway-oauth2-client-secret');
    setSecret('secrets.ccd.postcode-info-address-lookup-token', 'secrets.ccd.postcode-info-address-lookup-token');
    setSecret('secrets.ccd.microservicekey-ccd-gw', 'secrets.s2s.microservicekey-ccd-gw');
    setSecret('secrets.ccd.AppInsightsInstrumentationKey', 'appInsights.instrumentationKey');
  }
};

module.exports = { setup };