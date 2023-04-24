const config = require('config');

const fetch = require('node-fetch');
const HttpsProxyAgent = require('https-proxy-agent');
const { Logger } = require('@hmcts/nodejs-logging');
const logger = Logger.getLogger('addressLookup');
const crypto = require('crypto');

function addressLookup(postcode) {

  return fetch(
    config.address_lookup.url
       .replace('${key}', config.get('secrets.ccd.postcode-info-address-lookup-token'))
       .replace('${postcode}', postcode), getHttpConfig())
    .then(res => res.status === 200 ? res : res.text().then(body => badResponse(res, body)))
    .then(res => res.text())
    .catch((e) => {
      if (e.logMessage) {
        logger.error(e.logMessage, 'ErrorId=', e.error);
      }
      throw e;
    });
}

function getHttpConfig() {
  const httpConfig = {
    headers: {
      'Content-Type': 'application/json'
    }
  };
  if (config.address_lookup.detect_proxy && process.env.https_proxy) {
    httpConfig.agent = new HttpsProxyAgent(process.env.https_proxy);
  }
  return httpConfig;
}

function uniqueId() {
  return crypto.randomUUID();
}

function errorObj(logMessage, status) {
  return {
    error: uniqueId(),
    logMessage: logMessage,
    message: 'An error occurred calling the Postcode service.',
    status: status
  };
}

function badResponse(res, body) {
  throw errorObj(`An error response was received from the Postcode Service. Status=${res.status}, Body=${body}`, res.status);
}

module.exports = addressLookup;
