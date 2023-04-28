const DataTypeEntity = require('./datatype-entity');

class Column extends DataTypeEntity
{
  constructor(id, key, datatype, value, isUnique, referenceTo, externalReference)
  {
    super(id, datatype)
    this.key = key;
    this.value = value;
    this.isUnique = isUnique; 
    this.referenceTo = referenceTo;
    this.externalReference = externalReference;
  }
}

module.exports = Column