'use strict'

const joi = require('joi')
const log = require('loglevel');

const schema = joi.object({
  LOGGER_LEVEL: joi.string()
    .allow('error', 'warn', 'info', 'debug')
    .default('info'),
  LOGGER_ENABLED: joi.boolean()
    .truthy('TRUE')
    .truthy('true')
    .falsy('FALSE')
    .falsy('false')
    .default(true)
}).unknown()
  .required()

const { error, value: envVars } = schema.validate(process.env)
if (error) {
  throw new Error(`Config validation error: ${error.message}`)
}

const config = {
  logger: {
    level: envVars.LOGGER_LEVEL,
    enabled: envVars.LOGGER_ENABLED
  }
}

//Set default log level
log.setDefaultLevel(config.logger.level);

module.exports = config