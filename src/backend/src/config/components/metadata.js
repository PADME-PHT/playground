'use strict'

const joi = require('joi')

const schema = joi.object({
  METADATA_ENDPOINT: joi.string().uri()
    .required()
}).unknown()
  .required()

const { error, value: envVars } = schema.validate(process.env)

if (error) {
  throw new Error(`Config validation error: ${error.message}`)
}

const config = {
  metadata: {
    endpoint: envVars.METADATA_ENDPOINT
  }
}

module.exports = config