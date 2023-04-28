const { createRandomUnsafePassword } = require('../../../../utils/randUtils');
const createModelsAndTables = require('../../../../utils/sequelize-core');
const { ProvisionResult } = require("../../models/provision-result");
const log = require("loglevel").getLogger("postgresPlugin");
const sourceTypes = require('../../../models/source-types');
const semverCoerce = require('semver/functions/coerce');
const dockerUtil = require('../../../../utils/docker');
const PluginInfo = require('../../models/plugin-info');
const Range = require('semver/classes/range');
const { Sequelize } = require('sequelize');
const semver = require('semver');
const _ = require('lodash');
const Postgres_PORT = 5432;
const NETWORK_ALIAS = "postgres";

class PostgresPlugin
{
  imageLookup = [
    { range: new Range('>= 13 < 14'), image: 'postgres:13' }, 
    { range: new Range('>= 14 < 15'), image: 'postgres:14' },
  ]

  //------------------ internal methods ------------------

  /**
   * Returns the docker image that should be used for the given sourceTypeVersion
   * @param {Dataset} dataset 
   * @returns 
   */
  #getImageForVersion(dataset)
  {
    return _.find(this.imageLookup, lookup => semver.satisfies(semverCoerce(dataset.sourceTypeVersion), lookup.range));
  }

  /**
   * Returns the environment variables to use for the database
   * @param {*} databaseName 
   * @returns 
   */
  #getDefaultEnvironmentVariables(databaseName)
  {
    return {
      POSTGRES_PASSWORD: createRandomUnsafePassword(),
      POSTGRES_USER: "user",
      POSTGRES_DB: databaseName
    };
  }

  /**
   * Returns a string representation for the provided environment variables
   * @param {*} envs 
   * @returns 
   */
  #getEnvsStrings(envs)
  {
    return _.keys(envs).map(key => `${key}=${envs[key]}`);
  }

  /**
   * Builds the ProvisionResult object that can be returned
   * @param {*} container 
   * @param {*} targetPort 
   * @param {*} envs 
   * @returns 
   */
  #createProvisionResult(container, targetPort, envs)
  {
    let res = new ProvisionResult(container.id);
    res.addDataSourceHost(NETWORK_ALIAS);
    res.addDataSourcePort(targetPort);
    res.addDataSourcePassword(envs.POSTGRES_PASSWORD); 
    res.addDataSourceUsername(envs.POSTGRES_USER);

    return res;
  }

  /**
   * Creates the tables at the database
   * @param {*} container 
   * @param {*} envs 
   * @param {*} dataset
   * @returns an object that has the tables as a key and allows to lookup the sequelize models for the table
   */
  async #createTables(container, envs, dataset)
  {
    //First, get the Port binding from Dind such that we can connect
    let targetPort = await dockerUtil.getTargetPort(container, Postgres_PORT);
    let hostName = dockerUtil.getDindHostname();
    //Instantiate sequelize with the infos
    let sequelize = new Sequelize(envs.POSTGRES_DB, envs.POSTGRES_USER, envs.POSTGRES_PASSWORD, { dialect: 'postgres', port: targetPort, host: hostName });

    //Create Tables and get models
    return await createModelsAndTables(sequelize, dataset);
  }

  /**
   * Insert the given data into the db
   * @param {*} modelLookup 
   * @param {*} data 
   */
  async #insertData(dataset, modelLookup, data)
  {
    //Important: add in the right order to not get reference errors
    //For the same reason: only one table at a time, but the models for the table
    //can be added in parallel
    for (let table of dataset.getTablesSortedByTopology())
    {
      //Insert all instances into the database
      await Promise.all(data.getResultForTable(table.key).map(model => modelLookup[table.key].create(model)));
    }
  }

  //------------------ public methods ------------------
  /**
   * @param {*} dataset the dataset to instantiate
   * @param {*} network id of the network the database should be part of
   * @param {} data The data to insert
   */
  async provisionDataSource(dataset, network, data) {
    log.info(`Creating postgres instance for dataset ${dataset.title} with id ${dataset.id}`);
    let lookup = this.#getImageForVersion(dataset);
    let envs = this.#getDefaultEnvironmentVariables(dataset.key)
    let container = await dockerUtil.createContainerFromImageAndStart(lookup.image, this.#getEnvsStrings(envs), network, [Postgres_PORT], NETWORK_ALIAS);
    log.info(`Postgres instance for dataset ${dataset.title} with id ${dataset.id} created.`);
   
    log.info("Creating models and tables..."); 
    let modelLookup = await this.#createTables(container, envs, dataset);
    log.info("... tables created.");

    log.info("Inserting data..."); 
    await this.#insertData(dataset, modelLookup, data);
    log.info("data inserted.");
    return this.#createProvisionResult(container, Postgres_PORT, envs);
  }

  /**
   * Gets called at server startup to lower request times
   */
  async pullImages()
  {   
    log.info(`Pulling all images for the Postgres Plugin`);
    let promises = this.imageLookup.map(lookup => dockerUtil.pullImage(lookup.image));
    await Promise.all(promises);
    log.info(`Postgres Plugin images pulled`);
  }
}

module.exports.info = [new PluginInfo(sourceTypes.PostgresSQL, "13.0.0", "14.0.0")]
module.exports.class = PostgresPlugin;
module.exports.injectReference = false;
module.exports.enabled = true;