const config = require('config');
const fetch = require('../util/fetch');
const appInsights = require("applicationinsights");

const enableAppInsights = () => {
  // appInsights.defaultClient.config.samplingPercentage = 33; // 33% of all telemetry will be sent to Application Insights
  appInsights.setup(fetch('appInsights.instrumentationKey'))
    .setAutoDependencyCorrelation(true)
    .setAutoCollectConsole(true, true)
    .start()
}

module.exports = enableAppInsights;
