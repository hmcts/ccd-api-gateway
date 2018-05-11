const config = require('config');
const appInsights = require('applicationinsights');

const enabled = config.get('appInsights.enabled');

const enableAppInsights = () => {
  if (enabled) {
    const appInsightsKey = config.get('appInsights.instrumentationKey');
    appInsights.setup(appInsightsKey)
      .setAutoDependencyCorrelation(true)
      .setAutoCollectConsole(true, true)
      .start();
  }
};

module.exports = enableAppInsights;
