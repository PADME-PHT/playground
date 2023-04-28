const { removePrefixFromValue } = require('./../../../../utils/prefixUtils');
const { ProvisionResult } = require("../../models/provision-result");
const sourceTypes = require('../../../models/source-types');
const Prefix = require('./../../../query-engine/prefix');
const log = require("loglevel").getLogger("fhirPlugin");
const dockerUtil = require('../../../../utils/docker');
const PluginInfo = require('../../models/plugin-info');
const DataTypes = require('../../../models/datatypes');
const promiseRetry = require('promise-retry');
const axios = require('axios').default;
const _ = require('lodash');

const BLAZE_PORT = 8080;
const NETWORK_ALIAS = "blaze";
const IMAGE = "samply/blaze:0.20.3";

class BlazePlugin
{  
  //------------------ internal methods ------------------
  /**
   * Returns the environment variables to use for the database
   * @param {*} databaseName 
   * @returns 
   */
  #getDefaultEnvironmentVariables()
  {
    return {
      BASE_URL: `http://${NETWORK_ALIAS}:${BLAZE_PORT}`
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
   * Returns the base url to use
   * @param {*} hostname 
   * @param {*} port 
   * @param {*} entity 
   */
  #getTargetUrlBase(hostname, port)
  {
    return `http://${hostname}:${port}`;
  }

  /**
   * returns the target url to put a entity at
   * @param {*} hostname 
   * @param {*} port 
   */
  #getTargetFhirUrl(hostname, port)
  {
    return this.#getTargetUrlBase(hostname, port) + "/fhir";
  }
  
  /**
   * 
   * @param {*} hostname 
   * @param {*} port 
   */
  #getTargetHealthUrl(hostname, port)
  {
    return this.#getTargetUrlBase(hostname, port) + "/health";
  }

  /**
   * 
   * @param {*} hostname 
   * @param {*} port 
   * @param {*} entityName 
   * @param {*} entities 
   */
  async #createFHIREntities(targetUrl, entityName, entities)
  {
    let promises = entities.map(entity => {
      //append resource type property to the Entity (required by the fhir standard)
      entity["resourceType"] = entityName;
      //ensure id is a string (in fhir ids are strings..)
      entity["id"] = `${entity.id}`;
      //request
      return axios.put(`${targetUrl}/${entityName}/${entity.id}`, entity)
    });
    
    await Promise.all(promises);
  }

  /**
   * Appends the given prefix to the columns with key for every given result
   * @param {*} prefix 
   * @param {*} results 
   * @param {*} key 
   */
  #appendReferencePrefixToResults(prefix, results, key)
  {
    for (let result of results)
    {
      result[key] = `${prefix}/${result[key]}`;
    }
  }

  /**
   * Appends a prefix with the referenced entity to all columns that have a reference in the given list
   * @param {*} column 
   * @param {*} dataset 
   * @param {*} columnLookup 
   * @param {*} results 
   */
  #fixReferenceEntriesInList(column, dataset, columnLookup, results)
  {
    //List can be object or attribute
    if (column.datatype.dataTypeKind == DataTypes.Object)
    {
      //Proceed recursively
      results.forEach(res => {
        this.#fixReferenceEntries(column.datatype.datatype, dataset, columnLookup, res[column.key])
      });
    } else if (column.datatype.referenceTo)
    {
      //attribute
      results.forEach(res => {
        //Find the references table and append a prefix to each list entry
        let refTable = _.find(dataset.tables, (table) => _.find(columnLookup[table.key], { id: column.datatype.referenceTo }));
        let refEntity = this.#getEntityNameForTable(refTable);
        res[column.key].forEach((elem, i) => {
          this.#appendReferencePrefixToResults(refEntity, [res[column.key]], i);
        });
      });
    }
  }

  /**
   * Appends a prefix with the referenced entity to all columns that have a reference
   * @param {*} table 
   * @param {*} dataset 
   * @param {*} columnLookup 
   * @param {*} results 
   * @returns 
   */
  #fixReferenceEntries(table, dataset, columnLookup, results)
  {
    for (let column of table.columns)
    {
      //Column directly has a reference
      if (column.referenceTo != undefined) {
        let refTable = _.find(dataset.tables, (table) => _.find(columnLookup[table.key], { id: column.referenceTo }));
        let refEntity = this.#getEntityNameForTable(refTable);
        this.#appendReferencePrefixToResults(refEntity, results, column.key);
      } else if (column.dataTypeKind == DataTypes.Object) {
        //Proceed recursively
        results.forEach(res => this.#fixReferenceEntries(column.datatype, dataset, columnLookup, [res[column.key]]));
      } else if (column.dataTypeKind == DataTypes.List)
      {
        this.#fixReferenceEntriesInList(column, dataset, columnLookup, results);
      }
    }
  }

  /**
   * Waits for blaze to become available
   * @param {*} hostname 
   * @param {*} port 
   */
  async #waitForBlaze(hostname, port)
  {
    //Usually it takes ~60 seconds for blaze/fhir to become available
    //->To keep the waiting time for users as low as possible we use small intervals and retry often
    let promiseRetryOptions = {
      retries: 120,
      minTimeout: 1000, 
      maxTimeout: 1000,
    }
  
    let target = this.#getTargetHealthUrl(hostname, port)

    await promiseRetry((retry, number) => 
    {
      log.info(`Waiting for blaze to be ready - try number: ${number}`)
      
      //Get health endpoint till available
      return axios.get(target).catch((e) => {
        if (e.code == "ECONNREFUSED")
        {
          retry();  
        } else 
        {
          throw e;  
        }
      });
    }, promiseRetryOptions)
  }
  
  /**
   * Returns the Fhir entity name for the given table object
   * @param {*} table 
   * @returns 
   */
  #getEntityNameForTable(table)
  {
    return removePrefixFromValue(Prefix.fhir, table.key);;
  }

  /**
   * Inserts the generated FHIR data into the container
   * @param {*} container 
   * @param {*} dataset 
   * @param {*} data 
   */
  async #insertData(container, dataset, data)
  {
    let targetPort = await dockerUtil.getTargetPort(container, BLAZE_PORT);
    let hostName = dockerUtil.getDindHostname();
    let targetUrl = this.#getTargetFhirUrl(hostName, targetPort);

    //Wait for blaze
    await this.#waitForBlaze(hostName, targetPort);

    //Do the HTTP requests
    for (let table of dataset.getTablesSortedByTopology())
    {
      let entityName = this.#getEntityNameForTable(table);
      log.info(`Inserting data for entity ${entityName}`);
      let results = data.getResultForTable(table.key);
      //In the data we only get reference values with a id (e.g. 1,2, isic etc.)
      //However, Fhir requires the following format: EntityName/id
      //-> We need to prefix all the generated data with the entity the reference refers to
      this.#fixReferenceEntries(table, dataset, dataset.getFlattenedTableColumns(), results);
      await this.#createFHIREntities(targetUrl, entityName, results);
      log.info(`Data for entity ${entityName} inserted`);
    }
  }

  /**
   * Builds the ProvisionResult object that can be returned
   * @param {*} container 
   * @param {*} targetPort 
   * @param {*} envs 
   * @returns 
   */
   #createProvisionResult(container, targetPort)
   {
     let res = new ProvisionResult(container.id);
     res.addDataSourceHost(NETWORK_ALIAS);
     res.addDataSourcePort(targetPort); 
     return res;
   }
  
  //------------------ public methods ------------------
  /**
   * @param {*} dataset the dataset to instantiate
   * @param {*} network id of the network the database should be part of
   * @param {} data The data to insert
   */
  async provisionDataSource(dataset, network, data) {
    log.info(`Creating blaze fhir instance for dataset ${dataset.title} with id ${dataset.id}`);
    let envs = this.#getDefaultEnvironmentVariables()
    let container = await dockerUtil.createContainerFromImageAndStart(IMAGE, this.#getEnvsStrings(envs), network, [BLAZE_PORT], NETWORK_ALIAS);
    log.info(`Blaze fhir instance for dataset ${dataset.title} with id ${dataset.id} created.`);

    log.info("Inserting FHIR data..."); 
    await this.#insertData(container, dataset, data);
    log.info("FHIR data inserted.");
    return this.#createProvisionResult(container, BLAZE_PORT);
  }

  /**
   * Gets called at server startup to lower request times
   */
  async pullImages()
  {   
    log.info(`Pulling all images for the Blaze-FHIR Plugin`);
    await dockerUtil.pullImage(IMAGE)
    log.info(`Blaze-FHIR Plugin images pulled`);
  }
}

module.exports.info = [new PluginInfo(sourceTypes.Blaze, "0.10.3", "0.10.3")]
module.exports.class = BlazePlugin;
module.exports.injectReference = false;
module.exports.enabled = true;