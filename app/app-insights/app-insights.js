const config = require('config');
const appInsights = require('applicationinsights');

const enabled = config.get('appInsights.enabled');

const enableAppInsights = () => {
  if (enabled) {
    const appInsightsKey = config.get('secrets.ccd.AppInsightsInstrumentationKey');
    const appInsightsRoleName = config.get('appInsights.roleName');
    appInsights.setup(appInsightsKey)
      .setAutoDependencyCorrelation(true)
      .setAutoCollectConsole(true, true);
    appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRole] = appInsightsRoleName;
    appInsights.start();
  }
};

module.exports = enableAppInsights;
