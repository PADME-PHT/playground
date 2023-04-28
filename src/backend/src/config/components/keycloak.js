'use strict'

const joi = require('joi')
const { NoSuitablePluginError } = require('../../lib/source-provisioner/errors')

const schema = joi.object({
  KEYCLOAK_REALM: joi.string().required(), 
  KEYCLOAK_SERVER_URL: joi.string().uri().required(),
  KEYCLOAK_CLIENT_ID: joi.string().required()
}).unknown()
  .required()

const { error, value: keycloakValues } = schema.validate(process.env)

if (error) {
  throw new Error(`Config validation error: ${error.message}`)
}

const config = {
  keycloak: {
    resource: keycloakValues.KEYCLOAK_CLIENT_ID, 
    serverUrl: keycloakValues.KEYCLOAK_SERVER_URL,
    realm: keycloakValues.KEYCLOAK_REALM,    
  }
}

module.exports = config