# Sample Data Generator Plugins

## Idea

Plugins are node modules stored in sub-folders. Each plugin supports the generation of at least one data type. For details on the idea behind data types and how to add your own please see the user documentation [here](https://docs.padme-analytics.de/en/how-to/playground#datatypes) and the data types folder inside the models directory (same level as this directory). 

## Structure

Each Plugin should be a node module (see [here](https://nodejs.org/api/modules.html#modules_folders_as_modules)), exporting the following: 

- enabled -> Whether the plugin should be loaded
- info -> A List of supported datatype IRIS
- class -> A Reference to a node.js class that represents the plugin logic. The class should provide the following method:
    - createInstance -> Used by the data generator to generate an instance of a specific datatype (see below for details).

## Example 

index.js in the subfolder 'test'
```
const complexTypes = require('../../../models/datatypes/complexDataTypes');

class TestPlugin
{
  /**
  * Creates an instance of the datatype with the provided iri
  * @param {*} iri 
  * @param {*} length 
  * @returns 
  */
  createInstance(iri, length)
  {
    return "some Instance"
  }
}

module.exports.info = [
  complexTypes.ExampleDataType.value.uri, 
  complexTypes.ExampleDataType2.value.uri,
]
module.exports.class = TestPlugin;
module.exports.enabled = true;
```

## createInstance Method

The createInstance Source Method is the central method of the plugin. It receives two parameters: 

- iri -> The IRI of the data type that should be instantiated. This type can only be one of the types that the plugin supports according to the info export.
- length -> The length of the instance - if this data type supports setting a length (see user documentation as stated above).

The method should provide an instance of the requested data type as a return type. For Mime types, an object should be returned with a name and content property (see images plugin for example). 

Please feel free to browse the existing plugin implementations for more details.