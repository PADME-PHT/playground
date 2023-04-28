const Prefixes = require('./../../query-engine/prefix');
const prefix = Prefixes.xsd.value.replace(">", "").replace("<", "");
const phtPrefix = Prefixes.datatype.value.replace(">", "").replace("<", "");
const Enum = require('enum');

//Disclaimer: Adding new primitive datatypes might require changes in the source provisioner plugins
//Please consider adding types carefully
//Also: Add the new type to the docs (https://docs.padme-analytics.de/en/how-to/playground)
module.exports = new Enum(
  {
    //Primitive Types
    String: `${prefix}string`,
    Boolean: `${prefix}boolean`,
    Int: `${prefix}int`,
    UnsignedInt: `${prefix}unsignedInt`,
    Double: `${prefix}double`,
    Binary: `${phtPrefix}binary`,
  }
)