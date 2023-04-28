const log = require("loglevel").getLogger("pluginManager");
const setupThrobber = require('cli-color/throbber');
const { readdirSync } = require('fs')
const _ = require('lodash'); 
const path = require('path');
const { rsort } = require("semver");

class PluginManager {

  //------------------ Fields and constructor ------------------
  #dir;
  #validator;
  
  /**
   * @param {*} dir The directory to load plugins from
   * @param {(a: any, name: string, log : Logger) => boolean} validator A function that becomes a instance of a plugin and validates whether this plugin is valid
   */
  constructor(dir, validator)
  {
    this.#dir = dir;
    this.#validator = validator;
  }

  //------------------ internal Methods ------------------
  /**
   * @param {*} source 
   * @returns {string[]} all subdirectories of the specified source directory
   */
  #getDirectories(source)
  {
    return readdirSync(source, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
  } 

  /**
   * Checks that the plugin is valid and follows the guidelines
   * @param {any} plugin 
   * @param {string} name
   * @param {string} location
   * @returns 
   */
  #validatePlugin(plugin, name, location)
  {
    if (!plugin.enabled)
    {
      log.warn(`Plugin ${name} at ${location} is disabled and will not be loaded`);
      return false; 
    }
    if (!plugin.class)
    {
      log.warn(`Plugin ${name} at ${location} has no associated class, plugin will not be loaded`);
      return false; 
    }

    if (!plugin.info || !(plugin.info instanceof Array || plugin.info.length == 0))
    {
      log.warn(`The plugin ${name} has no or an invalid 'info' property (needs to be a array with at least one element)`); 
      return false;
    }

    //Validate with user provided function
    if (this.#validator && !this.#validator(plugin, name, log))
    {
      log.warn(`Plugin ${name} at ${location} was not valid, plugin will not be loaded`);
      return false;
    }

    return true;
  }

  /**
   * Loads the plugin with the given name from the provided location
   * @param {*} name 
   * @param {*} location 
   * @returns 
   */
  #loadPlugin(name, location)
  {
    //Load the plugin, add if enabled
    let plugin = require(location);
    if (!this.#validatePlugin(plugin, name, location))
    {
      return undefined;
    }

    //Success
    log.info(`Successfully loaded plugin ${name} from ${location}`);
    return plugin;
  }

  /**
   * loads all plugins in the given list
   * @param {*} dirs 
   */
  #loadPlugins(plugins)
  {
    let pluginsResult = [];
    //Load each directory as module
    for (let plugin of plugins)
    {
      let pluginPath = path.join(this.#dir, plugin);
      try
      {
        let result = this.#loadPlugin(plugin, pluginPath);
        if (result)
        {
          pluginsResult.push(result);
        }
      } catch (err)
      {
        if (err.code == 'ERR_UNSUPPORTED_DIR_IMPORT' || err.code == 'MODULE_NOT_FOUND')
        {
          log.error(`Plugin at path ${pluginPath} is not a valid node module and could not be loaded. The following error occurred:`);
          log.error(err);
        } else {
          throw err;
        }
      }
    }
    return pluginsResult;
  }

  //------------------ public Methods ------------------
  /**
   * 
   * @returns the list of plugins that have been loaded. This list contains the loaded modules which export the plugin info and class
   */
  loadPlugins()
  {
    log.info(`Loading plugins from ${this.#dir}`);

    //get all directories in the plugin dir
    let dirs = this.#getDirectories(this.#dir); 

    //Load plugins
    let res = this.#loadPlugins(dirs);
    log.info(`Loading plugins finished. Loaded ${res.length} plugins`);
    return res;
  }
}

module.exports = PluginManager