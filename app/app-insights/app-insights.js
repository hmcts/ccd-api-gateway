const config = require('config');
const appInsights = require('applicationinsights');

const enabled = config.get('appInsights.enabled');

function fineGrainedSampling(envelope) {
  // activity data is not interesting and should not really be going through this proxy anyway
  // when it was at 100% it was generating nearly 50% of HMCTS app insights data ingestion alone
  if (['RequestData', 'RemoteDependencyData'].includes(envelope.data.baseType) && (envelope.data.baseData.name.includes('/activity') || envelope.data.baseData.name.includes('/health'))) {
    envelope.sampleRate = 1;
  }

  return true;
}

const enableAppInsights = () => {
  if (enabled) {
    const appInsightsConnectionString = config.get('secrets.ccd.app-insights-connection-string');
    const appInsightsRoleName = config.get('appInsights.roleName');
    process.env.OTEL_SERVICE_NAME = appInsightsRoleName;
    appInsights.setup(appInsightsConnectionString)
      .setAutoDependencyCorrelation(true)
      .setAutoCollectConsole(true, true);
    appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRole] = appInsightsRoleName;
    appInsights.defaultClient.config.samplingPercentage = 1;
    appInsights.defaultClient.addTelemetryProcessor(fineGrainedSampling);
    appInsights.start();
  }
};

module.exports = enableAppInsights;
