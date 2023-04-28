const Enum = require('enum');

//The different types of datasets current supported
module.exports = new Enum(
  {
    Relational: `Relational`,
    ObjectCollection: `ObjectCollection`, 
    MimeType: `MimeType`
  }
)