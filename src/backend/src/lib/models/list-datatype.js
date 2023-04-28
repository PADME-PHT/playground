const DataTypeEntity = require('./datatype-entity');

class ListDatatype extends DataTypeEntity
{
  /**
   * Creates a new Instance of a list datatype
   * @param {*} id 
   * @param {*} datatype
   */
  constructor(id, datatype)
  {
    super(id, datatype)
  }
}

module.exports = ListDatatype