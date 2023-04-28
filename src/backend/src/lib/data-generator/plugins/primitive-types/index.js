
const { createRandomString, createRandomBool, createRandomInt, createRandomUnsignedInt, createRandomDouble} = require('./../../../../utils/randUtils');
const primitiveTypes = require('../../../models/datatypes/primitiveDataTypes');

class PrimitiveTypesPlugin
{
  
  lookup = {};

  constructor() {
    this.lookup[primitiveTypes.String.value] = (length) => createRandomString(length);
    this.lookup[primitiveTypes.Boolean.value] = (length) => createRandomBool(length);
    this.lookup[primitiveTypes.Int.value] = (length) => createRandomInt(length);
    this.lookup[primitiveTypes.UnsignedInt.value] = (length) => createRandomUnsignedInt(length);
    this.lookup[primitiveTypes.Double.value] = (length) => createRandomDouble(length);
  } 

  /**
   * Creates a instance of the datatype with the provided iri
   * @param {*} iri 
   * @param {*} length 
   * @returns 
   */
  createInstance(iri, length)
  {
    return this.lookup[iri](length);
  }
}

module.exports.info = [
  primitiveTypes.String.value, 
  primitiveTypes.Boolean.value, 
  primitiveTypes.Int.value, 
  primitiveTypes.Double.value, 
  primitiveTypes.UnsignedInt.value
]
module.exports.class = PrimitiveTypesPlugin;
module.exports.enabled = true;