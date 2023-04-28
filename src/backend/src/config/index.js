'use strict'

//Load all the config files
const common = require('./components/common');
const logger = require('./components/logger');
const server = require('./components/server');
const metadata = require('./components/metadata');
const keycloak = require('./components/keycloak');

module.exports = Object.assign({}, common, logger, server, metadata, keycloak);