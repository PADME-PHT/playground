'use strict'

const joi = require('joi')

const schema = joi.object({
  NODE_ENV: joi.string()
    .allow('development', 'production')
    .required()
}).unknown()
  .required()

const { error, value: envVars } = schema.validate(process.env)

if (error) {
  throw new Error(`Config validation error: ${error.message}`)
}

const config = {
  common: {
    envIsDevelopment: envVars.NODE_ENV == 'development',
    envIsProduction: envVars.NODE_ENV == 'production'
  }
}

module.exports = config