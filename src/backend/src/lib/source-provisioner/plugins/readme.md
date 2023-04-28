# Data source plugins

## Idea

Plugins are node modules and stored in sub-folders. Each plugin supports at last one data source type in a specific version. One plugin can also depend on other plugins and e.g. support multiple interconnected data sources by leveraging existing plugins.

## Structure

Each Plugin should be a node module (see [here](https://nodejs.org/api/modules.html#modules_folders_as_modules)), exporting the following: 

- enabled -> Whether the plugin should be loaded
- class -> A Reference to a node.js class that represents the plugin logic. The class should provide the following methods: 
    - pullImages -> Used in production to pull all images on startup to reduce request times
    - provisionDataSource -> provisions the actual data source
- info -> An array of PluginInfo objects describing the supported Data Source Type and version range. Each plugin can support multiple data source types and version ranges. Each Type is identified by a IRI as specified in the related metadata schema. This also allows introducing new types in an own schema. 
- injectReference (optional) -> Can be set to true to inject a reference to the data generator instead of the data directly

## Example 

index.js in the subfolder test1
```
const PluginInfo = require('../../plugin-info');
const sourceTypes = require('../../source-types');

class TestPlugin
{
  async provisionDataSource(dataset, network, data) 
  {
   
  }

  async pullImages()
  {

  }
}

module.exports.info = [new PluginInfo(sourceTypes.PostgresSQL, "1.2.3", "1.2.3")]
module.exports.class = TestPlugin;
module.exports.injectReference = false;
module.exports.enabled = true;
```

## provisionDataSource Method

The provisionData Source Method is the central method of the plugin. It receives tree parameters: 

- dataset -> instance of the internal dataset model. If the plugin supports multiple datasets (see blaze-fhir-minio plugin) this is a list
- network -> The id of the network where the provisioned containers should be put in
- data -> Two cases:
    - This is either an instance of the GenerationResult model from the data generator if the plugin set __injectReference__ to false
        - If the model supports multiple data sources, this will be an object that has the data source id as key and the created data as value
        - The GenerationResult model supports two types: MimeType base datasources and relational/object-oriented data source. See the model itself in the data-generator folder for details
            - In the case of mimetypes, the generated data will be a list of objects, each with the properties name and content. Name relates to a possible file name
    - Or a reference to the data generator if __injectReference__ is set to true

The method should provide an instance of ProvisionResult as a return type. 

Please feel free to browse the existing plugin implementations for more details.