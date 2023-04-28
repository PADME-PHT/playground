const ProvisionEnv = require('./provision-env');

const DATA_SOURCE_HOST_NAME = "DATA_SOURCE_HOST"; 
const DATA_SOURCE_PORT_NAME = "DATA_SOURCE_PORT"; 
const DATA_SOURCE_USERNAME_NAME = "DATA_SOURCE_USERNAME"; 
const DATA_SOURCE_PASSWORD_NAME = "DATA_SOURCE_PASSWORD"; 

/**
 * Describes that a plugin that supports a specific data source in a version range
 */
class ProvisionResult
{
  constructor(sourceContainerIds)
  {
    this.sourceContainerIds = Array.isArray(sourceContainerIds) ? sourceContainerIds : [sourceContainerIds];
    this.envs = [];
  }

  /**
   * Adds the default data source address environment variable with the given value
   * @param {*} value 
   */
  addDataSourceHost(value)
  {
    this.envs.push(new ProvisionEnv(DATA_SOURCE_HOST_NAME, value, "The target hostname or ip of the data source"));
  }

  /**
   * Adds the default data source address environment variable with the given value
   * @param {*} value 
   */
  addDataSourcePort(value)
  {
    this.envs.push(new ProvisionEnv(DATA_SOURCE_PORT_NAME, value, "The target port of the data source"));
  }

  /**
   * Adds the default data source address environment variable with the given value
   * @param {*} value 
   */
  addDataSourceUsername(value)
  {
    this.envs.push(new ProvisionEnv(DATA_SOURCE_USERNAME_NAME, value, "The username used for authentication at the data source"));
  }

   /**
   * Adds the default data source address environment variable with the given value
   * @param {*} value 
   */
  addDataSourcePassword(value)
  {
    this.envs.push(new ProvisionEnv(DATA_SOURCE_PASSWORD_NAME, value, "The password used for authentication at the data source"));
  }

  /**
   * Adds a custom environment variable for the provisioned data source
   * @param {ProvisionEnv} env A custom variable that should be added
   */
  addEnvVariable(env)
  {
    if (env instanceof ProvisionEnv)
    {
      this.envs.push(env)
    } else {
      throw new Error(`The provided variable was of type ${typeof env} instead of ProvisionEnv`);
    }
  }

}

module.exports =
{
  ProvisionResult, 
  DATA_SOURCE_HOST_NAME, 
  DATA_SOURCE_PORT_NAME, 
  DATA_SOURCE_USERNAME_NAME, 
  DATA_SOURCE_PASSWORD_NAME
}