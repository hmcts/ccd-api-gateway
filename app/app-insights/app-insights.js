const config = require('config');
const appInsights = require('applicationinsights');

const enableAppInsights = () => {
  // appInsights.defaultClient.config.samplingPercentage = 33; // 33% of all telemetry will be sent to Application Insights
  const appInsightsKey = config.get('appInsights.instrumentationKey');
  appInsights.setup(appInsightsKey)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectConsole(true, true)
    .start();
  console.log(`appInsights initialized with ${appInsightsKey}`);
};

module.exports = enableAppInsights;
