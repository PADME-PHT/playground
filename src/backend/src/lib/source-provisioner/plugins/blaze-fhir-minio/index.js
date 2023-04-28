const { ProvisionResult, DATA_SOURCE_HOST_NAME, DATA_SOURCE_PORT_NAME, DATA_SOURCE_PASSWORD_NAME, DATA_SOURCE_USERNAME_NAME } = require("../../models/provision-result");
const { pickRandom } = require('./../../../../utils/arrayUtils');
const log = require("loglevel").getLogger("fhir-MinIO-plugin");
const sourceTypes = require('../../../models/source-types');
const ProvisionEnv = require("../../models/provision-env");
const PluginInfo = require('../../models/plugin-info');
const fhirPlugin = require('../../plugins/blaze-fhir');
const DataTypes = require('../../../models/datatypes');
const minioPlugin = require('../../plugins/minio');
const _ = require('lodash');

class BlazeMinIOPlugin
{  
  //------------------ internal methods ------------------
  
  /**
   * Returns a usable plugin object
   * @param {*} plugin the loaded plugin module
   * @returns 
   */
  #getInstanceForPlugin(plugin)
  {
    return new plugin.class();
  }

  /**
   * Provisions a instance using the provided sub plugin
   * @param {*} dataset 
   * @param {*} network 
   * @param {*} data 
   */
  async #provisionSubPlugin(plugin, dataset, network, data)
  {
    log.info(`Provisioning data source with sub-plugin ${plugin.class.name}`); 
    let instance = this.#getInstanceForPlugin(plugin); 
    let res = await instance.provisionDataSource(dataset, network, data);
    log.info(`Finished provisioning data source with sub-plugin ${plugin.class.name}`);
    return res;
  }

  /**
   * Returns a string that can be used to reference minio
   * @param {*} minioRes 
   * @param {*} minioData 
   */
  #getMinioReference(minioRes, minioData)
  {
    let host = _.find(minioRes.envs, { name: DATA_SOURCE_HOST_NAME });
    let port = _.find(minioRes.envs, { name: DATA_SOURCE_PORT_NAME });
    let bucketName = minioPlugin.bucketName;
    let instance = pickRandom(minioData);
    return `http://${host.value}:${port.value}/${bucketName}/${instance.name}`;
  }

  /**
   * Fixes external reference entries for all elements of the given List
   * @param {*} minioSet 
   * @param {*} minioRes 
   * @param {*} minioData 
   * @param {*} fhirList 
   * @param {*} fhirData 
   */
  #fixExternalReferenceForList(minioSet, minioRes, minioData, fhirList, fhirData)
  {
    //List can be object or attribute
    if (fhirList.datatype.dataTypeKind == DataTypes.Object)
    {
      //Proceed recursively
      fhirData.forEach(res => {
        this.#fixExternalReferenceForObject(minioSet, minioRes, minioData, fhirList.datatype.datatype, res[fhirList.key])
      });
    } else if (fhirList.externalReference == minioSet.id)
    {
      //attribute
      //In the sample data generator at the moment a list with only "undefined" is created
      //since the generator only supports hasValue
      //For now, this should be find to just update this 'undefined' to a reference
      fhirData[0] = this.#getMinioReference(minioRes, minioData);
    }
  }

  /**
   * Fixes external reference entries for all columns of the given object
   * @param {*} minioSet 
   * @param {*} minioRes 
   * @param {*} minioData 
   * @param {*} fhirObject 
   * @param {*} fhirData 
   */
  #fixExternalReferenceForObject(minioSet, minioRes, minioData, fhirObject, fhirData)
  {
    for (let column of fhirObject.columns) {
      //Column has a reference to minio
      if (column.externalReference == minioSet.id) {
        fhirData.forEach(data => data[column.key] = this.#getMinioReference(minioRes, minioData));
      } else if (column.dataTypeKind == DataTypes.Object) {
        //Proceed recursively
        fhirData.forEach(data => this.#fixExternalReferenceForObject(minioSet, minioRes, minioData, column.datatype, [data[column.key]]));
      } else if (column.dataTypeKind == DataTypes.List) {
        this.#fixExternalReferenceForList(minioSet, minioRes, minioData, column, fhirData);
      }
    }
  }

  /**
   * @param {*} minioSet 
   * @param {*} minioRes 
   * @param {*} fhirSet 
   * @param {*} data 
   */
  #fixExternalReferences(minioSet, minioRes, minioData, fhirSet, fhirData)
  {
    for (let table of fhirSet.tables)
    {
      this.#fixExternalReferenceForObject(minioSet, minioRes, minioData, table, fhirData.getResultForTable(table.key));
    }
  }

  /**
   * Merges the two provision results together
   * @param {*} minioRes 
   * @param {*} fhirRes 
   */
  #mergeProvisionResults(minioRes, fhirRes)
  {
    let res = new ProvisionResult([minioRes.sourceContainerIds, fhirRes.sourceContainerIds]);
    //Problem: Both use the predefined HOST and Port names, we rename them

    //Add FHIR Stuff
    let fhirHost = _.find(fhirRes.envs, { name: DATA_SOURCE_HOST_NAME });
    res.addEnvVariable(new ProvisionEnv("FHIR_HOST_NAME", fhirHost.value, "The hostname of the FHIR server"));
    let fhirPort = _.find(fhirRes.envs, { name: DATA_SOURCE_PORT_NAME });
    res.addEnvVariable(new ProvisionEnv("FHIR_PORT", fhirPort.value, "The port of the FHIR server"));
    let remaining = fhirRes.envs.filter(x => x != fhirHost && x != fhirPort);
    remaining.forEach(env => res.addEnvVariable(env));

    //Add MinIO Stuff
    let minioHost = _.find(minioRes.envs, { name: DATA_SOURCE_HOST_NAME });
    res.addEnvVariable(new ProvisionEnv("MINIO_HOST_NAME", minioHost.value, "The hostname of the MinIO server"));
    let minioPort = _.find(minioRes.envs, { name: DATA_SOURCE_PORT_NAME });
    res.addEnvVariable(new ProvisionEnv("MINIO_PORT", minioPort.value, "The port of the MinIO server"));
    let minioUser = _.find(minioRes.envs, { name: DATA_SOURCE_USERNAME_NAME });
    res.addEnvVariable(new ProvisionEnv("MINIO_USER_NAME", minioUser.value, "The user used to authenticate at the MinIO server"));
    let minioPass = _.find(minioRes.envs, { name: DATA_SOURCE_PASSWORD_NAME });
    res.addEnvVariable(new ProvisionEnv("MINIO_PASSWORD", minioPass.value, "The password for authentication at the MinIO server"));
    let remainingMinIO = minioRes.envs.filter(x => x != minioHost && x != minioPort && x != minioUser && x != minioPass);
    remainingMinIO.forEach(env => res.addEnvVariable(env));

    return res;
  }

  //------------------ public methods ------------------
  /**
   * @param {*} dataset the dataset to instantiate
   * @param {*} network id of the network the database should be part of
   * @param {} data The data to insert
   */
  async provisionDataSource(datasets, network, data) {
    
    //Get Dataset
    let minioSet = _.find(datasets, { sourceTypeIRI: sourceTypes.MinIO });
    let fhirSet = _.find(datasets, { sourceTypeIRI: sourceTypes.Blaze });

    //Provision Minio
    let minioRes = await this.#provisionSubPlugin(minioPlugin, minioSet, network, data[minioSet.id]);

    //Fix the data (Add values for external references for minio)
    let minioData = data[minioSet.id].getGenerationResultForMimeTypes(); 
    let fhirData = data[fhirSet.id];
    this.#fixExternalReferences(minioSet, minioRes, minioData, fhirSet, fhirData)

    //Then provision fhir
    let fhirRes = await this.#provisionSubPlugin(fhirPlugin, fhirSet, network, data[fhirSet.id]);

    //Merge results
    return this.#mergeProvisionResults(minioRes, fhirRes);
  }

  /**
   * Gets called at server startup to lower request times
   */
  async pullImages()
  {   
    let fhirInstance = this.#getInstanceForPlugin(fhirPlugin);
    let minioInstance = this.#getInstanceForPlugin(minioPlugin);
    await Promise.all([fhirInstance.pullImages(), minioInstance.pullImages()]);
  }
}

module.exports.info = [new PluginInfo(sourceTypes.Blaze, "0.10.3", "0.10.3"), new PluginInfo(sourceTypes.MinIO, "22.9.1", "22.9.1")]
module.exports.class = BlazeMinIOPlugin;
module.exports.injectReference = false;
module.exports.enabled = true;