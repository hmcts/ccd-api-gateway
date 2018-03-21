const config = require('config');
const appInsights = require('applicationinsights');

const enableAppInsights = () => {
  const appInsightsKey = config.get('appInsights.instrumentationKey');
  appInsights.setup(appInsightsKey)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectConsole(true, true)
    .start();
};

module.exports = enableAppInsights;
