'use strict'

const joi = require('joi')

const schema = joi.object({
  API_PORT: joi.number()
    .required(), 
  CORS_ORIGIN: joi.string()
}).unknown()
  .required()

const { error, value: envVars } = schema.validate(process.env)
if (error) {
  throw new Error(`Config validation error: ${error.message}`)
}

const config = {
  server: {
    port: envVars.API_PORT,
    corsOrigin: envVars.CORS_ORIGIN
  }
}

module.exports = config