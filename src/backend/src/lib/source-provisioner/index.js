const NoSuitablePluginError = require('./errors.js').NoSuitablePluginError;
const PluginManager = require('../../utils/plugin-manager'); 
const log = require("loglevel").getLogger("sourceProvisioner");
const semverCoerce = require('semver/functions/coerce');
const DataGenerator = require('../data-generator');
const PluginInfo = require('./models/plugin-info');
const Session = require("./../models/session");
const Station = require('./../models/station');
const semver = require('semver');
const _ = require('lodash'); 
const ProvisionEnv = require('./models/provision-env.js');

class DataSourceProvisioner
{
  //------------------ Properties ------------------
  #pluginLookup = {};

  //------------------ Constructor ------------------

  /**
   * @returns A singleton DataSourceProvisioner object
   */
  constructor() {
    //Ensure only one DataSourceProvisioner can be created
    if (DataSourceProvisioner._instance) {
      return DataSourceProvisioner._instance;
    }
    DataSourceProvisioner._instance = this;
    
    //Load the plugins
    let self = this;
    let plugins = new PluginManager(`${__dirname}/plugins`, self.#validatePlugin).loadPlugins();

    //Index Plugins
    this.#buildPluginIndex(plugins);
  }

  //------------------ internal methods ------------------

  /**
   * Build a plugin index to lookup plugins when they are required
   * @param {*} plugins List of loaded plugins
   */
  #buildPluginIndex(plugins)
  {
    for (let plugin of plugins)
    {
      //Important: sort, otherwise the plugin not be found later
      let sorted = _.sortBy(plugin.info, info => info.sourceIRI);
      let iris = sorted.map(x => x.sourceIRI);
      let lookup = this.#getLookupIdForIRIs(iris);
      //If not exists, init list of plugins for this IRIS
      if (!this.#pluginLookup[lookup])
      {
        this.#pluginLookup[lookup] = [];
      }
      this.#pluginLookup[lookup].push(plugin);
    }
  }

  /**
   * Returns a lookup identifier for the provided list of plugin iris
   * @param {[string]} iris 
   */
  #getLookupIdForIRIs(iris)
  { 
    return iris.join(',');
  }

  /**
   * Validates that the provided plugins are valid and useable
   */
  #validatePlugin(plugin, name, log)
  {
    //Check each of the supported IRIs
    for (let i = 0; i < plugin.info.length; i++) {
      let iri = plugin.info[i];
      if (!(iri instanceof PluginInfo)) {
        log.warn(`The plugin ${name} has an invalid type at info index ${i} (needs to be an instance of PlugInfo)`);
        return false;
      }

      //If at least one of the types is invalid
      if (!iri.validate(name, log)) {
        return false;
      }
    }


    //Validate the methods
    if (!(typeof plugin.class.prototype.pullImages === "function"))
    {
      log.warn(`The plugin ${name} has no pullImages function`);
      return false;
    }

    if (!(typeof plugin.class.prototype.provisionDataSource === "function"))
    {
      log.warn(`The plugin ${name} has no provisionDataSource function`);
      return false;
    }

    return true;
  }

  /**
   * Resolves the data or reference to the data generator for one plugin
   * @param {*} plugin 
   */
  async #resolveDataOrGeneratorForPlugin(plugin, datasets)
  {
    let generator = new DataGenerator();
    if (plugin.injectReference) {
      return generator;
    } else {
      //Generate data for all sets of just a single
      if (Array.isArray(datasets))
      {
        let res = {};
        for (let dataset of datasets)
        {
          res[dataset.id] = await generator.generateDataForDataset(dataset);
        }
        return res;
      } else {
        return await generator.generateDataForDataset(datasets);
      }
    }
  }

  /**
   * Instantiates the data source with the provided plugin
   * @param {[Dataset]} datasets 
   * @param {any} plugin 
   */
  async #provisionSourceWithPlugin(datasets, plugin, network)
  {
    let pluginIns = this.#getInstanceForPlugin(plugin);
    let dataset = datasets.length == 1 ? datasets[0] : datasets;
    let data = await this.#resolveDataOrGeneratorForPlugin(plugin, dataset);
    return new Promise(async (resolve, reject) => 
    {
      try {
        let result = await pluginIns.provisionDataSource(dataset, network, data);
        resolve(result);
      } catch (err)
      {
        log.error(err);
        reject(err);
      }
    })
  }

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
   * Tries to find a plugin fo match all datasets
   * @param {*} datasets The list of datasets that need to be matched by the plugin
   * @param {*} plugins The list of available plugins
   * @returns {plugin | undefined} A plugin if found, undefined otherwise
   */
  #resolvePluginForVersion(datasets, plugins)
  {
    let res = _.find(plugins, (plugin) =>
    {
      let conjunction = plugin.info.map(info => 
      {
        let dataset = _.find(datasets, { sourceTypeIRI: info.sourceIRI });
        //Plugin needs to support the version of the dataset
        return semver.satisfies(semverCoerce(dataset.sourceTypeVersion), `${info.minVersion} - ${info.maxVersion}`)
      })
      //Return those plugins who satisfy all conditions
      return conjunction.reduce((x, y) => x && y);
    })
    return res ? res : undefined;
  }

  /**
   * @param {Station} station The Station to look for
   * @returns the plugin for this station if one can be found
   */
  #getPluginForStation(station)
  {
    let sorted = _.sortBy(station.datasets, set => set.sourceTypeIRI);
    let iris = sorted.map(dataset => dataset.sourceTypeIRI);
    let id = this.#getLookupIdForIRIs(iris); 
    let plugins = this.#pluginLookup[id] //First item or default (undefined)
    return this.#resolvePluginForVersion(station.datasets, plugins);
  }

  //------------------ public methods ------------------

  /**
   * @param {Station} stations The list of stations to look for
   * @return {boolean} whether all plugins exist to provision the data sources of the provided stations
   * @throws {NoSuitablePluginError}
   */
  canProvisionSourcesForStation(stations)
  {
    let conjunction = stations.map(station => this.#getPluginForStation(station) != undefined);
    if (!conjunction.reduce((x, y) => x && y))
    {
      let invalidIndex = _.filter(_.range(conjunction.length), x => !conjunction[x]);
      let failedStations = invalidIndex.map(i => stations[i].name);

      throw new NoSuitablePluginError(`No suitable plugin found for the dataset(s) of stations ${failedStations.join(' ')}`);
    }
    return true;
  }

  /**
   * Instantiates the data source(s) for the provided station object
   * @param {Station} station 
   * @returns {[string]} ids of the containers that have been created for this station
   * @throws {NoSuitablePluginError}
   */
  async provisionSourcesForStation(station, network)
  {
    //Get the identifier for the station
    let plugin = this.#getPluginForStation(station);

    //Throw error on no plugin
    if (!plugin)
    {
      log.error(`No suitable plugin could be found for the dataset(s) of station ${station.name}`)
      throw new NoSuitablePluginError(`No suitable plugin could be found for the dataset(s) of station ${station.name}`);   
    }

    let iris = station.datasets.map(dataset => dataset.sourceTypeIRI).join(' ');

    log.info(`Creating instance for IRIs ${iris} with plugin ${plugin.class.name} into network ${network}`);
    let res = await this.#provisionSourceWithPlugin(station.datasets, plugin, network)
    log.info(`Instance successfully created for IRIs ${iris} with plugin ${plugin.class.name} at network ${network}`);

    //Add default vars to distinguish stations
    res.addEnvVariable(new ProvisionEnv("STATION_NAME", station.name, "The name of the station currently visited"));

    return res;
  }

  /**
   * Pulls the docker images of all plugins.
   * This can reduce request times later on
   */
  async pullPluginImages()
  {
    log.info(`Preemptively pulling images of all plugins..`);

    let plugins = _.values(this.#pluginLookup).flat();
    let promises = plugins.map(plugin => {
      return new Promise(async (accept, reject) => {
        let pluginInstance = this.#getInstanceForPlugin(plugin);
        try {
          await pluginInstance.pullImages();
          accept();
        } catch (err) {
          reject(err);
        }
      });
    });
    
    await Promise.all(promises).catch(err => 
    {
      //We can ignore errors here, if some plugins might fail that we don't need in the end this is fine
      //Of course this may create problems down the line
      log.warn(`The following error occurred while pulling the images for the plugins:`);
      log.warn(err);
    })
    log.info(`Images of all plugins pulled.`);
  }
}

module.exports = DataSourceProvisioner;