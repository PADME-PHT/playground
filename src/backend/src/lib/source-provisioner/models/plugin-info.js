const sourceTypes = require('./../../models/source-types');
const semver = require('semver');
const _ = require('lodash');

/**
 * Describes that a plugin that supports a specific data source in a version range
 */
class PluginInfo
{
  constructor(sourceIRI, minVersion, maxVersion)
  {
    this.sourceIRI = sourceIRI;
    this.minVersion = minVersion;
    this.maxVersion = maxVersion; 
  }

  /**
   * @returns {boolean} Whether the properties of this PluginInfo instance are valid
   */
  validate(name, log)  
  { 
    if (!this.sourceIRI || !_.includes(_.values(sourceTypes), this.sourceIRI))
    {
      log.warn(`The plugin ${name} has no or an invalid 'sourceIRI' property`); 
      return false;
    }  

    if (!this.maxVersion || !semver.valid(this.maxVersion))
    {
      log.warn(`Plugin ${name} has no or an invalid 'maxVersion' property for IRI ${this.sourceIRI}`); 
      return false;
    }
  
    if (!this.minVersion || !semver.valid(this.minVersion))
    {
      log.warn(`Plugin ${name} has no or an invalid 'minVersion' property IRI ${this.sourceIRI}`); 
      return false;
    }
  
    if (semver.lt(this.maxVersion, this.minVersion))
    {
      log.warn(`The 'maxVersion' of plugin ${name} is lower then the 'minVersion' IRI ${this.sourceIRI}`); 
      return false;
    }

    return true;
  }
}

module.exports = PluginInfo