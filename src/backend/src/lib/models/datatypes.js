const Enum = require('enum');

//The type of the underlying datatype object
module.exports = new Enum(
  {
    //Primitive Types
    Atomic: "Atomic",
    Object: "Object",
    List: "List", 
    Attribute: "Attribute"
  }
)