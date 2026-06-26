#!/usr/bin/env node

/**
 * Module dependencies.
 */
import * as config from 'config';
import * as propertiesVolume from '@hmcts/properties-volume';
propertiesVolume.addTo(config);
import app from './app.js';
import debugLib from 'debug';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import fs from 'node:fs';
import log from '@hmcts/nodejs-logging';
import { fileURLToPath } from 'node:url';

const debug = debugLib('ccd-api-gateway-web:server');
const logger = log.Logger.getLogger('server');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(process.env.PORT || '3453');
logger.info('Starting on port ' + port);
app.set('port', port);

/**
 * Create HTTPS or HTTP server, depending on whether this is a local dev environment or not.
 */

const server = createServer(app);

function createServer(app) {
  if (process.env.ENV === 'localdev') {
    const sslDirectory = path.join(__dirname, '..', 'app', 'resources', 'localhost-ssl');
    const sslOptions = {
      cert: fs.readFileSync(path.join(sslDirectory, 'localhost.crt')),
      key: fs.readFileSync(path.join(sslDirectory, 'localhost.key')),
      secureProtocol: 'TLS_method'
    };
    return https.createServer(sslOptions, app);
  } else {
    return http.createServer(app);
  }
}

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.setTimeout(300000);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  const port = Number.parseInt(val, 10);

  if (Number.isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
