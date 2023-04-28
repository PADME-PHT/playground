const DataTypes = require("./datatypes");

class DataTypeEntity
{

  /**
   * Resolves the kind of underlying datatype
   * @param {*} type 
   */
  #getDataTypeKind(type)
  {
    //We require only when the method is called because otherwise we get circular reference problems...
    //I know, not the cleanest way, but it works
    if (type instanceof require("./atomic-datatype"))  
    {
      return DataTypes.Atomic;
    } else if (type instanceof require("./tabular"))
    {
      return DataTypes.Object;
    } else if (type instanceof require("./list-datatype"))
    {
      return DataTypes.List;
    } else if (type instanceof require("./column"))
    {
      return DataTypes.Attribute;  
    }
  }

  /**
   * Core class for models that contain a datatype
   * @param {*} id 
   * @param {*} datatype 
   */
  constructor(id, datatype)
  {
    this.id = id;  
    this.datatype = datatype;
    this.dataTypeKind = this.#getDataTypeKind(datatype);
  }
}

module.exports = DataTypeEntity