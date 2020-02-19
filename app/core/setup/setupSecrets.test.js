const { expect } = require('test/util/chai');
const { cloneDeep } = require('lodash');
const config = require('config');
const proxyquire = require('proxyquire');

const modulePath = 'app/core/setup/setupSecrets';

let mockConfig = {};

describe(modulePath, () => {
  describe('#setup', () => {
    beforeEach(() => {
      mockConfig = cloneDeep(config);
    });

    it('should set config values when secrets path is set', () => {
      mockConfig.secrets = {
        ccd: {
          'ccd-api-gateway-oauth2-client-secret': 'clientSecretValue',
          'postcode-info-address-lookup-token': 'postCodeValue',
          'microservicekey-ccd-gw': 'idamValue',
          'AppInsightsInstrumentationKey': 'appInsightsValue'
        }
      };

      // Update config with secret setup
      const setupSecrets = proxyquire(modulePath,
        { config: mockConfig });
      setupSecrets.setup();

      expect(mockConfig.secrets.ccd.ccd-api-gateway-oauth2-client-secret)
        .to.equal(mockConfig.secrets.ccd['ccd-api-gateway-oauth2-client-secret']);
      expect(mockConfig.secrets.ccd.postcode-info-address-lookup-token)
        .to.equal(mockConfig.secrets.ccd['postcode-info-address-lookup-token']);
      expect(mockConfig.secrets.s2s.microservicekey-ccd-gw)
        .to.equal(mockConfig.secrets.ccd['microservicekey-ccd-gw']);
      expect(mockConfig.appInsights.instrumentationKey)
        .to.equal(mockConfig.secrets.ccd['AppInsightsInstrumentationKey']);
    });

    it('should not set config values when secrets path is not set', () => {
      // Update config with secret setup
      const setupSecrets = proxyquire(modulePath,
        { config: mockConfig });
      setupSecrets.setup();

      expect(mockConfig.secrets.ccd.ccd-api-gateway-oauth2-client-secret)
        .to.equal(config.secrets.ccd.ccd-api-gateway-oauth2-client-secret);
      expect(mockConfig.secrets.ccd.postcode-info-address-lookup-token)
        .to.equal(config.secrets.ccd.postcode-info-address-lookup-token);
      expect(mockConfig.secrets.s2s.microservicekey-ccd-gw)
        .to.equal(config.secrets.s2s.microservicekey-ccd-gw);
      expect(mockConfig.appInsights.instrumentationKey)
        .to.equal(config.appInsights.instrumentationKey);
    });

    it('should only set one config value when single secret path is set', () => {
      mockConfig.secrets = { ccd: { 'microservicekey-ccd-gw': 'idamValue' } };

      // Update config with secret setup
      const setupSecrets = proxyquire(modulePath,
        { config: mockConfig });
      setupSecrets.setup();

      expect(mockConfig.secrets.ccd.ccd-api-gateway-oauth2-client-secret)
        .to.equal(config.secrets.ccd.ccd-api-gateway-oauth2-client-secret);
      expect(mockConfig.secrets.ccd.postcode-info-address-lookup-token)
        .to.equal(config.secrets.ccd.postcode-info-address-lookup-token);
      expect(mockConfig.secrets.s2s.microservicekey-ccd-gw)
        .to.equal(mockConfig.secrets.ccd['microservicekey-ccd-gw']);
      expect(mockConfig.appInsights.instrumentationKey)
        .to.equal(config.appInsights.instrumentationKey);
    });
  });
});