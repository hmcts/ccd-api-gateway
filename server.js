#!/usr/bin/env node

/**
 * Module dependencies.
 */

require('@hmcts/properties-volume').addTo(require('config'));
let app = require('./app');
let debug = require('debug')('ccd-api-gateway-web:server');
let http = require('http');
let https = require('https');
let path = require('path');
let fs = require('fs');

/**
 * Get port from environment and store in Express.
 */

let port = normalizePort(process.env.PORT || '3453');
console.log('Starting on port ' + port);
app.set('port', port);

/**
 * Create HTTPS or HTTP server, depending on whether this is a local dev environment or not.
 */

let server = createServer(app);

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
  let port = parseInt(val, 10);

  if (isNaN(port)) {
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

  let bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
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
  let addr = server.address();
  let bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
